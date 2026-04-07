/* ════════════════════════════════════════════
   CRYPTO UTILS — AES-GCM via WebCrypto API
   Enhanced KDF: PBKDF2 dua lapis (SHA-256 + SHA-512)
   ════════════════════════════════════════════ */

const VER_ENHANCED = 0xAB;

const ENC = {
  async deriveKey(password, salt, enhanced = true) {
    const pwBuf = new TextEncoder().encode(password);
    if (enhanced) {
      const km1 = await crypto.subtle.importKey('raw', pwBuf, 'PBKDF2', false, ['deriveBits']);
      const bits1 = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, km1, 256
      );
      const salt2 = new Uint8Array(await crypto.subtle.digest('SHA-256',
        new Uint8Array([...salt, ...new Uint8Array(bits1)])));
      const km2 = await crypto.subtle.importKey('raw', bits1, 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt2, iterations: 100000, hash: 'SHA-512' },
        km2, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
      );
    } else {
      const km = await crypto.subtle.importKey('raw', pwBuf, 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' },
        km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
      );
    }
  },

  async encrypt(plaintext, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await this.deriveKey(password, salt, true);
    const ct   = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
    const buf  = new Uint8Array(1 + 16 + 12 + ct.byteLength);
    buf[0] = VER_ENHANCED;
    buf.set(salt, 1); buf.set(iv, 17);
    buf.set(new Uint8Array(ct), 29);
    return btoa(String.fromCharCode(...buf));
  },

  async decrypt(b64, password) {
    const buf      = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const enhanced = buf[0] === VER_ENHANCED;
    const offset   = enhanced ? 1 : 0;
    const salt     = buf.slice(offset, offset + 16);
    const iv       = buf.slice(offset + 16, offset + 28);
    const ct       = buf.slice(offset + 28);
    const key      = await this.deriveKey(password, salt, enhanced);
    const pt       = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(pt);
  }
};
