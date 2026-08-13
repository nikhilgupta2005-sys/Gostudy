-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "siteName" TEXT NOT NULL DEFAULT 'GoStudy',
    "tagline" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "heroTitle" TEXT NOT NULL DEFAULT '',
    "heroText" TEXT NOT NULL DEFAULT '',
    "promoMediaUrl" TEXT NOT NULL DEFAULT '',
    "promoMediaType" TEXT NOT NULL DEFAULT 'image',
    "enquiryMode" TEXT NOT NULL DEFAULT 'both',
    "whatsappNumber" TEXT NOT NULL DEFAULT '',
    "enquiryAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "enquiryAlertEmail" TEXT NOT NULL DEFAULT '',
    "legalName" TEXT NOT NULL DEFAULT '',
    "gst" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "contactAddress" TEXT NOT NULL DEFAULT '',
    "mapsLink" TEXT NOT NULL DEFAULT '',
    "instagramHandle" TEXT NOT NULL DEFAULT '',
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "facebookHandle" TEXT NOT NULL DEFAULT '',
    "facebookUrl" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Setting" ("contactAddress", "contactEmail", "contactPhone", "enquiryMode", "facebookHandle", "facebookUrl", "gst", "heroText", "heroTitle", "id", "instagramHandle", "instagramUrl", "legalName", "logoUrl", "mapsLink", "promoMediaType", "promoMediaUrl", "siteName", "tagline", "whatsappNumber") SELECT "contactAddress", "contactEmail", "contactPhone", "enquiryMode", "facebookHandle", "facebookUrl", "gst", "heroText", "heroTitle", "id", "instagramHandle", "instagramUrl", "legalName", "logoUrl", "mapsLink", "promoMediaType", "promoMediaUrl", "siteName", "tagline", "whatsappNumber" FROM "Setting";
DROP TABLE "Setting";
ALTER TABLE "new_Setting" RENAME TO "Setting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
