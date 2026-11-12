// The original schema includes obsolete public grants; never reapply it over protected migrations.
console.error('Legacy schema initialization is disabled. Use the versioned security-migration workflow. No data was changed.');
process.exitCode = 1;
