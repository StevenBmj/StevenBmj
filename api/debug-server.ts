export default async function handler(_req: any, res: any) {
  try {
    await import('../server');
    res.status(200).json({ ok: true, imported: true });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      message: error?.message || String(error),
      stack: error?.stack || null,
    });
  }
}
