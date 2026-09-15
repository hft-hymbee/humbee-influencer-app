/**
 * Request-field encryption for the auth endpoints.
 *
 * THIS IS NOT IN THE V2 CONTRACT DOC, AND IT IS NOT OPTIONAL. `POST /auth/otp/request` and
 * `POST /auth/otp/verify` validate `mobile_number` (and `otp`) by **decrypting** them
 * server-side — `api/auth/helper/decryptor.py` in the platform, RSA + PKCS1-OAEP + SHA-256 over
 * a base64 payload. Sending the plain digits the doc shows fails DTO validation and comes back
 * as the generic *"Something went wrong. Please try again later."*, which names neither the
 * field nor the cause. That dead end cost a debugging session; hence this comment.
 *
 * The scheme, the key and the library are all taken from the VCP app
 * (`humbee-mobile-app/src/V2/Encryption/`), which is the reference implementation on this
 * platform — deliberately, so the two clients cannot drift into two ciphers.
 *
 * Scope: **auth request bodies only.** Nothing else on the influencer API is encrypted, and
 * every response is plaintext.
 */
import forge from 'node-forge';

/**
 * The platform's PUBLIC key — the same one the VCP app ships. A public key is not a secret (it
 * only encrypts; the private half stays on the server), so it lives in the bundle rather than
 * behind a fetch the login screen would have to wait on.
 */
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA+DzJMZgSY91CMoA5EUZV
iYzNvtH65zFH0CJN2thkjRG7722z0XZl5VJMy4kpv1EqtsRNlxpQD1430KJOuqlQ
73J1TIKj0zKQGIqfMDT/JN8uBuLO4P6yk0mvDBNzj5wY6OsA+W3Ur1iM9dPDC4S9
fObexqIhwY8gNFOCmDz9ObjLChu+nRUITA2Ze4LnU2gSgIukgkHOemD51vJ/DNAE
nDYsBcALCCmIUDvcFXWWeA3kb053AVr62ZHx7ltOpb8xNgawzV0AjKYo9n4wkiip
kznaqBUGtTOav02fu035BaFUQqXQ9sYrEXnNlqDtjbBzZf16xiCNqss29/cLvWGo
4wIDAQAB
-----END PUBLIC KEY-----`;

/** Parsed once: `publicKeyFromPem` is not free, and login re-encrypts on every resend. */
let cachedKey: forge.pki.rsa.PublicKey | null = null;
function key(): forge.pki.rsa.PublicKey {
  if (!cachedKey) cachedKey = forge.pki.publicKeyFromPem(PUBLIC_KEY_PEM);
  return cachedKey;
}

/**
 * RSA-OAEP(SHA-256) → base64, byte-for-byte what the server's `get_decrypted_value` expects.
 *
 * Throws rather than returning null on failure: the VCP app returns null here, which turns a
 * crypto bug into a validation error at the server and a misleading message at the user. A
 * throw surfaces it at the call site where it actually happened.
 */
export function encryptField(value: string): string {
  const encrypted = key().encrypt(value, 'RSA-OAEP', { md: forge.md.sha256.create() });
  return forge.util.encode64(encrypted);
}
