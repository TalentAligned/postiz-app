import { PrismaRepository, PrismaTransaction } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VoiceProfileRepository {
  constructor(
    private _voiceProfiles: PrismaRepository<'voiceProfile'>,
    private _transaction: PrismaTransaction
  ) {}

  findByUserAndOrg(userId: string, orgId: string) {
    return this._voiceProfiles.model.voiceProfile.findMany({
      where: { userId, organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this._voiceProfiles.model.voiceProfile.findUnique({
      where: { id },
    });
  }

  create(data: {
    userId: string;
    organizationId: string;
    toneName: string;
    toneDescription?: string;
    sampleContent?: string;
    platforms?: string[];
    isDefault?: boolean;
  }) {
    return this._voiceProfiles.model.voiceProfile.create({
      data,
    });
  }

  update(
    id: string,
    data: {
      toneName?: string;
      toneDescription?: string;
      sampleContent?: string;
      platforms?: string[];
      isDefault?: boolean;
    }
  ) {
    return this._voiceProfiles.model.voiceProfile.update({
      where: { id },
      data,
    });
  }

  delete(id: string, orgId: string) {
    return this._voiceProfiles.model.voiceProfile.delete({
      where: { id, organizationId: orgId },
    });
  }

  async setDefault(id: string, userId: string, orgId: string) {
    return this._transaction.model.$transaction([
      this._voiceProfiles.model.voiceProfile.updateMany({
        where: { userId, organizationId: orgId },
        data: { isDefault: false },
      }),
      this._voiceProfiles.model.voiceProfile.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);
  }
}
