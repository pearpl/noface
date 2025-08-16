<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);
// Storage dir
$storageDir = realpath(__DIR__ . '/../storage');
if ($storageDir === false) { $storageDir = __DIR__ . '/../storage'; }
if (!is_dir($storageDir)) { @mkdir($storageDir, 0775, true); }
$logFile = $storageDir . '/counter.log';
function clog($msg) { global $logFile; @file_put_contents($logFile, '['.date('c').'] '.$msg."\n", FILE_APPEND); }
$debug = isset($_GET['debug']);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    header('X-JSON-OK: 1');
    echo json_encode(['ok' => true]);
    exit();
}

// Primary counter file now stored in public/storage for deployment copying (dist/storage)
$counterFile = $storageDir . '/counter.json';

// Migrate legacy file if it exists in api directory
$legacy = __DIR__ . '/counter.json';
if (is_file($legacy) && !is_file($counterFile)) {
    @rename($legacy, $counterFile);
}

// Initialize counter file atomically if it doesn't exist
if (!file_exists($counterFile)) {
    $initialData = [ 'images' => 0, 'faces' => 0, 'updatedAt' => date('c') ];
    $tmp = $counterFile . '.tmp.' . uniqid('', true);
    file_put_contents($tmp, json_encode($initialData, JSON_PRETTY_PRINT));
    @chmod($tmp, 0664);
    @rename($tmp, $counterFile);
    clog('Initialized counter file');
}

function readCounter($file) {
    if (!is_file($file)) {
        return ['images' => 0, 'faces' => 0, 'updatedAt' => date('c')];
    }
    $raw = @file_get_contents($file);
    $data = $raw ? json_decode($raw, true) : null;
    if (is_array($data) && isset($data['images']) && isset($data['faces'])) {
        return $data;
    }
    // Attempt backup
    $bak = $file . '.bak';
    if (is_file($bak)) {
        $rawBak = @file_get_contents($bak);
        $bakData = $rawBak ? json_decode($rawBak, true) : null;
        if (is_array($bakData) && isset($bakData['images']) && isset($bakData['faces'])) {
            return $bakData;
        }
    }
    return ['images' => 0, 'faces' => 0, 'updatedAt' => date('c')];
}

function writeCounter($file, $data) {
    $data['updatedAt'] = date('c');
    $json = json_encode($data, JSON_PRETTY_PRINT);
    $tmp = $file . '.tmp.' . uniqid('', true);
    if (@file_put_contents($tmp, $json) === false) {
        return [false, 'write_tmp_failed'];
    }
    @chmod($tmp, 0664);
    // Backup previous
    if (is_file($file)) {
        @copy($file, $file . '.bak');
    }
    // Atomic replace
    if (!@rename($tmp, $file)) {
        return [false, 'rename_failed'];
    }
    // No separate mirror needed; file already public.
    return [true, null];
}

function validateInteger($value, $min = 0, $max = 1000000) {
    $int = filter_var($value, FILTER_VALIDATE_INT);
    return ($int !== false && $int >= $min && $int <= $max) ? $int : false;
}

$startBuffer = '';
if (function_exists('ob_get_length') && ob_get_length()) {
    $startBuffer = '[warn:initial-output-buffer-not-empty]';
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $lockFile = $counterFile . '.lock';
        $lock = @fopen($lockFile, 'c');
        if ($lock && flock($lock, LOCK_SH)) {
            $data = readCounter($counterFile);
            flock($lock, LOCK_UN);
            fclose($lock);
        } else {
            $data = readCounter($counterFile);
        }
        if ($debug) { $data['_debug'] = ['ts' => microtime(true), 'buf' => $startBuffer]; }
        header('X-JSON-OK: 1');
        echo json_encode($data);
        exit();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $inputRaw = file_get_contents('php://input');
        $input = json_decode($inputRaw, true);
        if (!$input) {
            clog('POST invalid JSON raw="'.substr($inputRaw,0,80).'"');
            http_response_code(400);
            header('X-JSON-OK: 0');
            $out = ['error' => 'Invalid JSON input'];
            if ($debug) { $out['_raw'] = substr($inputRaw, 0, 120); }
            echo json_encode($out);
            exit();
        }
        $images = isset($input['images']) ? validateInteger($input['images'], 0, 100) : false;
        $faces = isset($input['faces']) ? validateInteger($input['faces'], 0, 1000) : false;
        if ($images === false || $faces === false) {
            clog('POST invalid values images='.json_encode($input['images']??null).' faces='.json_encode($input['faces']??null));
            http_response_code(400);
            header('X-JSON-OK: 0');
            echo json_encode(['error' => 'Invalid input values', '_debug' => $debug ? ['images' => $input['images'] ?? null, 'faces' => $input['faces'] ?? null] : null]);
            exit();
        }
        $lockFile = $counterFile . '.lock';
        $lock = @fopen($lockFile, 'c');
        if (!$lock || !flock($lock, LOCK_EX)) {
            clog('POST lock failure');
            http_response_code(500);
            header('X-JSON-OK: 0');
            echo json_encode(['error' => 'Could not acquire lock', '_debug' => $debug ? ['lock_exists' => (bool)$lock] : null]);
            exit();
        }
        try {
            $data = readCounter($counterFile);
            $data['images'] += $images;
            $data['faces'] += $faces;
            [$ok, $code] = writeCounter($counterFile, $data);
            if (!$ok) {
                clog('POST write failure code='.$code);
                http_response_code(500);
                header('X-JSON-OK: 0');
                echo json_encode(['error' => 'Failed to write counter file', 'code' => $code]);
                exit();
            }
            if ($debug) { $data['_debug'] = ['ts' => microtime(true)]; }
            clog('POST success +i='.$images.'+f='.$faces.' => images='.$data['images'].' faces='.$data['faces']);
            header('X-JSON-OK: 1');
            echo json_encode(['success' => true, 'data' => $data]);
            exit();
        } finally {
            if ($lock) { flock($lock, LOCK_UN); fclose($lock); }
            @unlink($lockFile);
        }
    } else {
        http_response_code(405);
        header('X-JSON-OK: 0');
        echo json_encode(['error' => 'Method not allowed']);
        exit();
    }
} catch (Exception $e) {
    clog('EXCEPTION '.$e->getMessage());
    http_response_code(500);
    header('X-JSON-OK: 0');
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage(), 'trace' => $debug ? $e->getTrace() : null]);
    exit();
}