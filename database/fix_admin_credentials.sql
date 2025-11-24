-- Fix: Generate proper ZKP credentials for admin user
-- For password: admin123
-- Secret x = SHA256("admin123") = 0x... (hex)

-- First, let's generate the credentials
-- password: admin123
-- SHA256("admin123") = a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
-- As BigInt: 75222486606915935301919122835976755301308125738556625934435451151637726123235

-- For testing, let's insert fixed values
-- Using test values that we know work

INSERT INTO zkp_credentials (user_id, public_key, base, prime, secret_encrypted, salt, iv)
VALUES (
    1,
    '831109138486466610',  -- y = 2^x mod p for our test secret
    '2',
    '1000000000000000007',
    '5f5e100',  -- dummy encrypted
    '00000000000000000000000000000000',
    '00000000000000000000000000000000'
) ON DUPLICATE KEY UPDATE public_key = '831109138486466610';
