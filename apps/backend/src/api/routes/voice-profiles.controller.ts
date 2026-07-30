import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { VoiceProfileService } from '@gitroom/nestjs-libraries/database/prisma/voice-profiles/voice-profile.service';
import { CreateVoiceProfileDto } from '@gitroom/nestjs-libraries/dtos/voice-profiles/create-voice-profile.dto';
import { UpdateVoiceProfileDto } from '@gitroom/nestjs-libraries/dtos/voice-profiles/update-voice-profile.dto';

@ApiTags('Voice Profiles')
@Controller('/user/voice-profiles')
export class VoiceProfilesController {
  constructor(private _voiceProfileService: VoiceProfileService) {}

  @Get('/')
  async getProfiles(
    @GetUserFromRequest() user: User,
    @GetOrgFromRequest() org: Organization
  ) {
    return this._voiceProfileService.getProfiles(user.id, org.id);
  }

  @Post('/')
  async createProfile(
    @GetUserFromRequest() user: User,
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateVoiceProfileDto
  ) {
    return this._voiceProfileService.createProfile(user.id, org.id, body);
  }

  @Get('/:id')
  async getProfile(
    @GetUserFromRequest() user: User,
    @Param('id') id: string
  ) {
    return this._voiceProfileService.getProfile(id, user.id);
  }

  @Put('/:id')
  async updateProfile(
    @GetUserFromRequest() user: User,
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: UpdateVoiceProfileDto
  ) {
    return this._voiceProfileService.updateProfile(id, user.id, org.id, body);
  }

  @Delete('/:id')
  async deleteProfile(
    @GetUserFromRequest() user: User,
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._voiceProfileService.deleteProfile(id, user.id, org.id);
  }

  @Post('/:id/default')
  async setDefault(
    @GetUserFromRequest() user: User,
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._voiceProfileService.setDefault(id, user.id, org.id);
  }
}
