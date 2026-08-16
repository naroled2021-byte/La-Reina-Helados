# Manda bytes crudos (ESC/POS) directo a una impresora ya instalada en Windows, usando la
# misma cola/driver que ya usa el sistema hoy — sin reemplazar el driver USB ni tocar nada
# de lo que ya funciona para imprimir desde el navegador.
param(
  [Parameter(Mandatory = $true)][string]$PrinterName,
  [Parameter(Mandatory = $true)][string]$FilePath
)

$ErrorActionPreference = "Stop"

Add-Type -Namespace RawPrint -Name Native -MemberDefinition @"
[StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
public struct DOCINFOA {
  [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
  [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
  [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
}

[DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

[DllImport("winspool.Drv", EntryPoint="ClosePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
public static extern bool ClosePrinter(IntPtr hPrinter);

[DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, DOCINFOA di);

[DllImport("winspool.Drv", EntryPoint="StartPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
public static extern bool StartPagePrinter(IntPtr hPrinter);

[DllImport("winspool.Drv", EntryPoint="EndPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
public static extern bool EndPagePrinter(IntPtr hPrinter);

[DllImport("winspool.Drv", EntryPoint="EndDocPrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
public static extern bool EndDocPrinter(IntPtr hPrinter);

[DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);
"@

$hPrinter = [IntPtr]::Zero
$opened = [RawPrint.Native]::OpenPrinter($PrinterName, [ref]$hPrinter, [IntPtr]::Zero)
if (-not $opened) {
  Write-Error "No se pudo abrir la impresora '$PrinterName'"
  exit 1
}

try {
  $di = New-Object RawPrint.Native+DOCINFOA
  $di.pDocName = "Comanda La Reina Helados"
  $di.pDataType = "RAW"

  if (-not [RawPrint.Native]::StartDocPrinter($hPrinter, 1, $di)) {
    Write-Error "No se pudo iniciar el trabajo de impresión"
    exit 1
  }
  [RawPrint.Native]::StartPagePrinter($hPrinter) | Out-Null

  $bytes = [System.IO.File]::ReadAllBytes($FilePath)
  $ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
  try {
    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
    $written = 0
    $ok = [RawPrint.Native]::WritePrinter($hPrinter, $ptr, $bytes.Length, [ref]$written)
  } finally {
    [System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
  }

  [RawPrint.Native]::EndPagePrinter($hPrinter) | Out-Null
  [RawPrint.Native]::EndDocPrinter($hPrinter) | Out-Null

  if (-not $ok -or $written -ne $bytes.Length) {
    Write-Error "Fallo al escribir los datos a la impresora (escritos: $written de $($bytes.Length))"
    exit 1
  }
} finally {
  [RawPrint.Native]::ClosePrinter($hPrinter) | Out-Null
}

exit 0
