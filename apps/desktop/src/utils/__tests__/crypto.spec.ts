import { describe, expect, it } from 'vitest'
import { decrypt, encrypt, unzip, zip } from '@/utils/crypto'

describe('utils/crypto', () => {
  describe('encrypt / decrypt', () => {
    it('round-trips a plain ASCII message', () => {
      const message = 'euclid-test-secret'
      expect(decrypt(encrypt(message))).toBe(message)
    })

    it('produces a different ciphertext for each call (random salt/IV)', () => {
      const message = 'same-input'
      expect(encrypt(message)).not.toBe(encrypt(message))
    })

    it('round-trips unicode content', () => {
      const message = 'hi 👋 — ünïcödé テスト'
      expect(decrypt(encrypt(message))).toBe(message)
    })
  })

  describe('zip / unzip', () => {
    it('round-trips an object', () => {
      const value = { a: 1, b: ['x', 'y'], nested: { ok: true } }
      expect(unzip(zip(JSON.stringify(value)))).toEqual(value)
    })

    it('round-trips unicode strings', () => {
      const value = 'héllo ✨ wörld'
      expect(unzip(zip(JSON.stringify(value)))).toBe(value)
    })

    it('produces base64 output', () => {
      expect(zip(JSON.stringify({ a: 1 }))).toMatch(/^[A-Za-z0-9+/]+=*$/)
    })

    it('is deterministic for identical input', () => {
      const payload = JSON.stringify({ hello: 'world' })
      expect(zip(payload)).toBe(zip(payload))
    })
  })
})
