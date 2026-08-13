[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Za-z0-9_-]{8,}$')]
    [string]$VoiceId
)

$secureKey = Read-Host 'ElevenLabs API kljuc (unos se ne prikazuje)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
    $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    if ([string]::IsNullOrWhiteSpace($plainKey)) {
        throw 'API kljuc ne moze biti prazan.'
    }
    [Environment]::SetEnvironmentVariable('ELEVENLABS_API_KEY', $plainKey, 'User')
    [Environment]::SetEnvironmentVariable('ELEVENLABS_READING_VOICE_ID', $VoiceId, 'User')
    Write-Host 'Podaci su lokalno sacuvani za generisanje. Kljuc nije prikazan niti upisan u repozitorijum.' -ForegroundColor Green
}
finally {
    if ($pointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}
