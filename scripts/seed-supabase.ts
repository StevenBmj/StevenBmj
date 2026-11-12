// Legacy snapshots contain plaintext credentials and cannot safely initialize a live store.
console.error('Legacy data import is disabled. Use the versioned migrations and a reviewed encrypted restoration procedure. No data was changed.');
process.exitCode = 1;
