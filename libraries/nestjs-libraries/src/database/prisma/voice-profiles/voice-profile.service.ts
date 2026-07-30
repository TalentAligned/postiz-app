import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { VoiceProfileRepository } from '@gitroom/nestjs-libraries/database/prisma/voice-profiles/voice-profile.repository';
import { CreateVoiceProfileDto } from '@gitroom/nestjs-libraries/dtos/voice-profiles/create-voice-profile.dto';
import { UpdateVoiceProfileDto } from '@gitroom/nestjs-libraries/dtos/voice-profiles/update-voice-profile.dto';

@Injectable()
export class VoiceProfileService {
  constructor(private _voiceProfileRepository: VoiceProfileRepository) {}

  getProfiles(userId: string, orgId: string) {
    return this._voiceProfileRepository.findByUserAndOrg(userId, orgId);
  }

  async getProfile(id: string, userId: string) {
    const profile = await this._voiceProfileRepository.findById(id);
    if (!profile || profile.userId !== userId) {
      throw new HttpException('Voice profile not found', HttpStatus.NOT_FOUND);
    }
    return profile;
  }

  async createProfile(
    userId: string,
    orgId: string,
    dto: CreateVoiceProfileDto
  ) {
    return this._voiceProfileRepository.create({
      userId,
      organizationId: orgId,
      toneName: dto.toneName,
      toneDescription: dto.toneDescription,
      sampleContent: dto.sampleContent,
      platforms: dto.platforms || [],
      isDefault: dto.isDefault || false,
    });
  }

  async updateProfile(
    id: string,
    userId: string,
    orgId: string,
    dto: UpdateVoiceProfileDto
  ) {
    const profile = await this._voiceProfileRepository.findById(id);
    if (!profile || profile.userId !== userId || profile.organizationId !== orgId) {
      throw new HttpException('Voice profile not found', HttpStatus.NOT_FOUND);
    }
    return this._voiceProfileRepository.update(id, {
      toneName: dto.toneName,
      toneDescription: dto.toneDescription,
      sampleContent: dto.sampleContent,
      platforms: dto.platforms,
      isDefault: dto.isDefault,
    });
  }

  async deleteProfile(id: string, userId: string, orgId: string) {
    const profile = await this._voiceProfileRepository.findById(id);
    if (!profile || profile.userId !== userId || profile.organizationId !== orgId) {
      throw new HttpException('Voice profile not found', HttpStatus.NOT_FOUND);
    }
    return this._voiceProfileRepository.delete(id, orgId);
  }

  async setDefault(id: string, userId: string, orgId: string) {
    const profile = await this._voiceProfileRepository.findById(id);
    if (!profile || profile.userId !== userId || profile.organizationId !== orgId) {
      throw new HttpException('Voice profile not found', HttpStatus.NOT_FOUND);
    }
    return this._voiceProfileRepository.setDefault(id, userId, orgId);
  }
}
