import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const portalConfigSchema = new mongoose.Schema({
  // /dev portal credentials
  devUsername: { type: String, default: 'nutan_dev' },
  devPasswordHash: { type: String, required: true },

  // /mypanel portal credentials
  ownerUsername: { type: String, default: 'nutan_owner' },
  ownerPasswordHash: { type: String, required: true },

  // /mypanel second-factor secret word
  ownerSecretWordHash: { type: String, required: true },
}, { timestamps: true });

// Helper: compare plain text against stored hash
portalConfigSchema.methods.compareDevPassword = function (plain) {
  return bcrypt.compare(plain, this.devPasswordHash);
};
portalConfigSchema.methods.compareOwnerPassword = function (plain) {
  return bcrypt.compare(plain, this.ownerPasswordHash);
};
portalConfigSchema.methods.compareOwnerSecret = function (plain) {
  return bcrypt.compare(plain, this.ownerSecretWordHash);
};

const PortalConfig = mongoose.model('PortalConfig', portalConfigSchema);

/**
 * Seed default credentials if no config document exists yet.
 * Called once at server startup.
 */
export async function seedPortalConfig() {
  const count = await PortalConfig.countDocuments();
  if (count === 0) {
    const salt = await bcrypt.genSalt(12);
    await PortalConfig.create({
      devUsername: 'nutan_dev',
      devPasswordHash: await bcrypt.hash('NutanDev@2025', salt),
      ownerUsername: 'nutan_owner',
      ownerPasswordHash: await bcrypt.hash('NutanOwner@2025', salt),
      ownerSecretWordHash: await bcrypt.hash('SunriseNutan', salt),
    });
    console.log('✅ Portal config seeded with default credentials');
  }
}

export default PortalConfig;
