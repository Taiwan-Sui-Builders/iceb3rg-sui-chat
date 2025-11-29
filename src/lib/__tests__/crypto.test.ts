import { describe, it, expect, beforeAll } from 'vitest';
import {
  initCrypto,
  getSignMessage,
  deriveEncryptionKeypair,
  createRandomSymmetricKey,
  encryptWithPublicKey,
  decryptWithSecretKey,
  encryptMessage,
  decryptMessage,
  toBase64,
  fromBase64,
} from '../crypto';

describe('Crypto Module', () => {
  // ============================================
  // Setup
  // ============================================

  beforeAll(async () => {
    await initCrypto();
  });

  // ============================================
  // 1. initCrypto 測試
  // ============================================

  describe('initCrypto', () => {
    it('初始化不應報錯', async () => {
      await expect(initCrypto()).resolves.not.toThrow();
    });
  });

  // ============================================
  // 2-3. deriveEncryptionKeypair 測試
  // ============================================

  describe('deriveEncryptionKeypair', () => {
    it('同樣的簽名應該產生同樣的 keypair（確定性）', async () => {
      const signature = new Uint8Array(64).fill(0x42);

      const keypair1 = await deriveEncryptionKeypair(signature);
      const keypair2 = await deriveEncryptionKeypair(signature);

      expect(keypair1.publicKey).toEqual(keypair2.publicKey);
      expect(keypair1.secretKey).toEqual(keypair2.secretKey);
    });

    it('不同的簽名應該產生不同的 keypair', async () => {
      const signature1 = new Uint8Array(64).fill(0x42);
      const signature2 = new Uint8Array(64).fill(0x43);

      const keypair1 = await deriveEncryptionKeypair(signature1);
      const keypair2 = await deriveEncryptionKeypair(signature2);

      expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
      expect(keypair1.secretKey).not.toEqual(keypair2.secretKey);
    });

    it('keypair 應該有正確的長度 (32 bytes)', async () => {
      const signature = new Uint8Array(64).fill(0x01);
      const keypair = await deriveEncryptionKeypair(signature);

      expect(keypair.publicKey.length).toBe(32);
      expect(keypair.secretKey.length).toBe(32);
    });
  });

  // ============================================
  // getSignMessage 測試
  // ============================================

  describe('getSignMessage', () => {
    it('應該回傳正確的簽名訊息', () => {
      expect(getSignMessage()).toBe('sui-chat:derive-encryption-key:v1');
    });
  });

  // ============================================
  // createRandomSymmetricKey 測試
  // ============================================

  describe('createRandomSymmetricKey', () => {
    it('應該產生 32 bytes 的金鑰', () => {
      const key = createRandomSymmetricKey();
      expect(key.length).toBe(32);
    });

    it('每次呼叫應該產生不同的金鑰', () => {
      const key1 = createRandomSymmetricKey();
      const key2 = createRandomSymmetricKey();
      expect(key1).not.toEqual(key2);
    });
  });

  // ============================================
  // 4-5. Sealed Box 加解密測試
  // ============================================

  describe('encryptWithPublicKey + decryptWithSecretKey', () => {
    it('加密後可以正確解密', async () => {
      const signature = new Uint8Array(64).fill(0xAB);
      const keypair = await deriveEncryptionKeypair(signature);

      const originalData = createRandomSymmetricKey(); // 32 bytes
      const encrypted = encryptWithPublicKey(originalData, keypair.publicKey);
      const decrypted = decryptWithSecretKey(encrypted, keypair.secretKey);

      expect(decrypted).not.toBeNull();
      expect(decrypted).toEqual(originalData);
    });

    it('加密後的資料長度應該是 input + 48 bytes', async () => {
      const signature = new Uint8Array(64).fill(0xAB);
      const keypair = await deriveEncryptionKeypair(signature);

      const originalData = new Uint8Array(32);
      const encrypted = encryptWithPublicKey(originalData, keypair.publicKey);

      // Sealed box overhead: 32 (ephemeral pk) + 16 (MAC) = 48
      expect(encrypted.length).toBe(32 + 48);
    });

    it('用錯誤的 secretKey 解密應該回傳 null', async () => {
      const signature1 = new Uint8Array(64).fill(0xAB);
      const keypair1 = await deriveEncryptionKeypair(signature1);

      const signature2 = new Uint8Array(64).fill(0xCD);
      const keypair2 = await deriveEncryptionKeypair(signature2);

      const originalData = createRandomSymmetricKey();
      const encrypted = encryptWithPublicKey(originalData, keypair1.publicKey);

      // 用錯誤的 secretKey 解密
      const decrypted = decryptWithSecretKey(encrypted, keypair2.secretKey);
      expect(decrypted).toBeNull();
    });

    it('加密資料被篡改應該回傳 null', async () => {
      const signature = new Uint8Array(64).fill(0xAB);
      const keypair = await deriveEncryptionKeypair(signature);

      const originalData = createRandomSymmetricKey();
      const encrypted = encryptWithPublicKey(originalData, keypair.publicKey);

      // 篡改加密資料
      encrypted[0] ^= 0xFF;

      const decrypted = decryptWithSecretKey(encrypted, keypair.secretKey);
      expect(decrypted).toBeNull();
    });
  });

  // ============================================
  // 6-8. 訊息加解密測試
  // ============================================

  describe('encryptMessage + decryptMessage', () => {
    it('加密後可以正確解密', () => {
      const key = createRandomSymmetricKey();
      const message = 'Hello, Sui Chat! 你好世界 🎉';

      const encrypted = encryptMessage(message, key);
      const decrypted = decryptMessage(encrypted, key);

      expect(decrypted).toBe(message);
    });

    it('空訊息也可以正確加解密', () => {
      const key = createRandomSymmetricKey();
      const message = '';

      const encrypted = encryptMessage(message, key);
      const decrypted = decryptMessage(encrypted, key);

      expect(decrypted).toBe(message);
    });

    it('長訊息也可以正確加解密', () => {
      const key = createRandomSymmetricKey();
      const message = 'A'.repeat(10000);

      const encrypted = encryptMessage(message, key);
      const decrypted = decryptMessage(encrypted, key);

      expect(decrypted).toBe(message);
    });

    it('用錯誤的 key 解密應該回傳 null', () => {
      const key1 = createRandomSymmetricKey();
      const key2 = createRandomSymmetricKey();
      const message = 'Secret message';

      const encrypted = encryptMessage(message, key1);
      const decrypted = decryptMessage(encrypted, key2);

      expect(decrypted).toBeNull();
    });

    it('同樣的訊息加密兩次，密文應該不同（因為 nonce 不同）', () => {
      const key = createRandomSymmetricKey();
      const message = 'Same message';

      const encrypted1 = encryptMessage(message, key);
      const encrypted2 = encryptMessage(message, key);

      expect(encrypted1).not.toBe(encrypted2);

      // 但兩者都可以正確解密
      expect(decryptMessage(encrypted1, key)).toBe(message);
      expect(decryptMessage(encrypted2, key)).toBe(message);
    });

    it('加密訊息被篡改應該回傳 null', () => {
      const key = createRandomSymmetricKey();
      const message = 'Original message';
      const encrypted = encryptMessage(message, key);

      // 篡改 base64 字串
      const tamperedChar = encrypted[5] === 'A' ? 'B' : 'A';
      const tampered = encrypted.slice(0, 5) + tamperedChar + encrypted.slice(6);

      const decrypted = decryptMessage(tampered, key);
      expect(decrypted).toBeNull();
    });

    it('無效的 base64 應該回傳 null', () => {
      const key = createRandomSymmetricKey();
      const decrypted = decryptMessage('not-valid-base64!!!', key);
      expect(decrypted).toBeNull();
    });

    it('錯誤的 version 應該回傳 null', () => {
      const key = createRandomSymmetricKey();
      const message = 'Test message';
      const encrypted = encryptMessage(message, key);

      // 解碼並修改 version
      const data = fromBase64(encrypted);
      data[0] = 0x99; // 錯誤的 version
      const modifiedEncrypted = toBase64(data);

      const decrypted = decryptMessage(modifiedEncrypted, key);
      expect(decrypted).toBeNull();
    });
  });

  // ============================================
  // 9. Base64 工具函數測試
  // ============================================

  describe('toBase64 + fromBase64', () => {
    it('應該互為逆操作', () => {
      const original = new Uint8Array([0, 1, 2, 255, 128, 64, 32]);
      const base64 = toBase64(original);
      const recovered = fromBase64(base64);

      expect(recovered).toEqual(original);
    });

    it('空陣列應該正確處理', () => {
      const original = new Uint8Array(0);
      const base64 = toBase64(original);
      const recovered = fromBase64(base64);

      expect(recovered).toEqual(original);
    });

    it('隨機資料應該正確轉換', () => {
      for (const length of [1, 16, 32, 64, 100, 256]) {
        const original = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
          original[i] = Math.floor(Math.random() * 256);
        }

        const base64 = toBase64(original);
        const recovered = fromBase64(base64);

        expect(recovered).toEqual(original);
      }
    });

    it('toBase64 輸出應該是有效的 base64 字串', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const base64 = toBase64(data);

      // 應該只包含 base64 字元
      expect(base64).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });
  });

  // ============================================
  // 整合測試
  // ============================================

  describe('Integration Tests', () => {
    it('完整的聊天室金鑰交換流程', async () => {
      // 模擬兩個用戶
      const aliceSignature = new Uint8Array(64).fill(0x11);
      const bobSignature = new Uint8Array(64).fill(0x22);

      const aliceKeypair = await deriveEncryptionKeypair(aliceSignature);
      const bobKeypair = await deriveEncryptionKeypair(bobSignature);

      // Alice 創建聊天室，產生對稱金鑰
      const roomKey = createRandomSymmetricKey();

      // Alice 把金鑰加密給自己和 Bob
      const encryptedKeyForAlice = encryptWithPublicKey(roomKey, aliceKeypair.publicKey);
      const encryptedKeyForBob = encryptWithPublicKey(roomKey, bobKeypair.publicKey);

      // Alice 和 Bob 分別解出金鑰
      const aliceDecryptedKey = decryptWithSecretKey(encryptedKeyForAlice, aliceKeypair.secretKey);
      const bobDecryptedKey = decryptWithSecretKey(encryptedKeyForBob, bobKeypair.secretKey);

      expect(aliceDecryptedKey).toEqual(roomKey);
      expect(bobDecryptedKey).toEqual(roomKey);

      // Alice 發送加密訊息
      const aliceMessage = 'Hi Bob! 🚀';
      const encryptedMessage = encryptMessage(aliceMessage, aliceDecryptedKey!);

      // Bob 解密訊息
      const bobReceivedMessage = decryptMessage(encryptedMessage, bobDecryptedKey!);
      expect(bobReceivedMessage).toBe(aliceMessage);

      // Bob 回覆
      const bobMessage = '你好 Alice！很高興認識你';
      const bobEncrypted = encryptMessage(bobMessage, bobDecryptedKey!);
      const aliceReceived = decryptMessage(bobEncrypted, aliceDecryptedKey!);
      expect(aliceReceived).toBe(bobMessage);
    });

    it('第三方無法解密訊息', async () => {
      const aliceKeypair = await deriveEncryptionKeypair(new Uint8Array(64).fill(0xAA));
      const bobKeypair = await deriveEncryptionKeypair(new Uint8Array(64).fill(0xBB));
      const eveKeypair = await deriveEncryptionKeypair(new Uint8Array(64).fill(0xEE));

      // 創建聊天室金鑰，只加密給 Alice 和 Bob
      const roomKey = createRandomSymmetricKey();
      const encryptedKeyForAlice = encryptWithPublicKey(roomKey, aliceKeypair.publicKey);
      const encryptedKeyForBob = encryptWithPublicKey(roomKey, bobKeypair.publicKey);

      // Eve 嘗試解密 - 應該失敗
      expect(decryptWithSecretKey(encryptedKeyForAlice, eveKeypair.secretKey)).toBeNull();
      expect(decryptWithSecretKey(encryptedKeyForBob, eveKeypair.secretKey)).toBeNull();

      // Alice 發送訊息
      const message = 'This is a secret!';
      const encrypted = encryptMessage(message, roomKey);

      // Eve 沒有 roomKey，無法解密
      const wrongKey = createRandomSymmetricKey();
      expect(decryptMessage(encrypted, wrongKey)).toBeNull();
    });

    it('publicKey 可以正確序列化和反序列化', async () => {
      const signature = new Uint8Array(64).fill(0x55);
      const keypair = await deriveEncryptionKeypair(signature);

      // 模擬存到鏈上（base64 編碼）
      const publicKeyBase64 = toBase64(keypair.publicKey);

      // 模擬從鏈上讀取（base64 解碼）
      const recoveredPublicKey = fromBase64(publicKeyBase64);

      // 用恢復的 publicKey 加密
      const data = createRandomSymmetricKey();
      const encrypted = encryptWithPublicKey(data, recoveredPublicKey);

      // 用原本的 secretKey 解密
      const decrypted = decryptWithSecretKey(encrypted, keypair.secretKey);
      expect(decrypted).toEqual(data);
    });
  });
});
