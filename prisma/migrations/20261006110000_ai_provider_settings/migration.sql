CREATE TABLE "AIProviderSetting" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "baseURL" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "encryptedApiKey" TEXT,
    "keyless" BOOLEAN NOT NULL DEFAULT false,
    "tokenParameter" TEXT NOT NULL DEFAULT 'max_tokens',
    "embeddingModel" TEXT NOT NULL DEFAULT '',
    "transcriptionModel" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIProviderSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
