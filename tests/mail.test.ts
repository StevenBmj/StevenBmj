import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { sendEmail } from '../serverless/_supabase';

test('email success requires the intended recipient to be accepted, not merely a resolved SMTP call', async () => {
  const previous = { user: process.env.MAIL_USER, password: process.env.MAIL_APP_PASSWORD };
  process.env.MAIL_USER = 'owner@example.test'; process.env.MAIL_APP_PASSWORD = 'test-only';
  const stub = mock.method(nodemailer, 'createTransport', () => ({ sendMail: async () => ({ accepted: [], rejected: ['client@example.test'] }) }));
  try { assert.equal(await sendEmail('client@example.test', 'Test', '<p>Test</p>'), false); }
  finally { stub.mock.restore(); if (previous.user === undefined) delete process.env.MAIL_USER; else process.env.MAIL_USER = previous.user; if (previous.password === undefined) delete process.env.MAIL_APP_PASSWORD; else process.env.MAIL_APP_PASSWORD = previous.password; }
});
