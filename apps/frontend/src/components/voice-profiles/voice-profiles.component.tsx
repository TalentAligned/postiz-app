'use client';

import React, { FC, Fragment, useCallback, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import useSWR from 'swr';
import { Button } from '@gitroom/react/form/button';
import clsx from 'clsx';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';

interface VoiceProfile {
  id: string;
  toneName: string;
  toneDescription?: string;
  sampleContent?: string;
  platforms: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_PLATFORMS = [
  'LinkedIn',
  'Facebook',
  'Instagram',
  'Reddit',
  'X (Twitter)',
  'Google',
  'TikTok',
  'YouTube',
];

function useVoiceProfiles() {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/user/voice-profiles')).json();
  }, []);
  return useSWR('voice-profiles', load);
}

export const VoiceProfilesComponent: FC = () => {
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();
  const { data, mutate } = useVoiceProfiles();

  const addOrEditProfile = useCallback(
    (profile?: VoiceProfile) => () => {
      modal.openModal({
        title: profile
          ? t('edit_voice_profile', 'Edit Voice Profile')
          : t('add_voice_profile', 'Add Voice Profile'),
        withCloseButton: true,
        children: <VoiceProfileForm data={profile} reload={mutate} />,
      });
    },
    [mutate]
  );

  const deleteProfile = useCallback(
    (profile: VoiceProfile) => async () => {
      if (
        await deleteDialog(
          t(
            'are_you_sure_delete_voice_profile',
            'Are you sure you want to delete this voice profile?',
            { name: profile.toneName }
          )
        )
      ) {
        await fetch(`/user/voice-profiles/${profile.id}`, {
          method: 'DELETE',
        });
        mutate();
        toaster.show('Voice profile deleted successfully', 'success');
      }
    },
    []
  );

  const setDefault = useCallback(
    (profile: VoiceProfile) => async () => {
      await fetch(`/user/voice-profiles/${profile.id}/default`, {
        method: 'POST',
      });
      mutate();
      toaster.show('Default voice profile updated', 'success');
    },
    []
  );

  return (
    <div className="flex flex-col">
      <h3 className="text-[20px]">
        {t('voice_profiles', 'Voice Profiles')}
      </h3>
      <div className="text-customColor18 mt-[4px]">
        {t(
          'voice_profiles_description',
          'Configure your personal posting voice and tone. AI agents will use these profiles when generating content on your behalf.'
        )}
      </div>
      <div className="my-[16px] mt-[16px] bg-sixth border-fifth items-center border rounded-[4px] p-[24px] flex gap-[24px]">
        <div className="flex flex-col w-full">
          {!!data?.length && (
            <div className="grid grid-cols-[1fr,1fr,1fr,1fr,1fr] w-full gap-y-[10px]">
              <div>{t('name', 'Name')}</div>
              <div className="text-center">
                {t('platforms', 'Platforms')}
              </div>
              <div className="text-center">
                {t('default', 'Default')}
              </div>
              <div className="text-center">{t('edit', 'Edit')}</div>
              <div className="text-center">{t('delete', 'Delete')}</div>
              {data?.map((profile: VoiceProfile) => (
                <Fragment key={profile.id}>
                  <div className="relative flex-1 me-[20px] overflow-x-hidden">
                    <div className="absolute start-0 line-clamp-1 top-[50%] -translate-y-[50%] text-ellipsis">
                      {profile.toneName}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center relative me-[20px]">
                    <div className="text-center w-full absolute start-0 line-clamp-1 top-[50%] -translate-y-[50%]">
                      {profile.platforms.length > 0
                        ? profile.platforms.slice(0, 2).join(', ') +
                          (profile.platforms.length > 2
                            ? ` +${profile.platforms.length - 2}`
                            : '')
                        : 'All'}
                    </div>
                  </div>
                  <div className="flex justify-center items-center">
                    {profile.isDefault ? (
                      <span className="text-green-400 text-sm font-medium">
                        {t('default', 'Default')}
                      </span>
                    ) : (
                      <Button onClick={setDefault(profile)}>
                        {t('set_default', 'Set Default')}
                      </Button>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <div>
                      <Button onClick={addOrEditProfile(profile)}>
                        {t('edit', 'Edit')}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div>
                      <Button onClick={deleteProfile(profile)}>
                        {t('delete', 'Delete')}
                      </Button>
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          )}
          <div>
            <Button
              onClick={addOrEditProfile()}
              className={clsx((data?.length || 0) > 0 && 'my-[16px]')}
            >
              {t('add_voice_profile', 'Add Voice Profile')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VoiceProfileForm: FC<{
  data?: VoiceProfile;
  reload: () => void;
}> = (props) => {
  const { data, reload } = props;
  const fetch = useFetch();
  const toast = useToaster();
  const modal = useModals();
  const t = useT();

  const [toneName, setToneName] = useState(data?.toneName || '');
  const [toneDescription, setToneDescription] = useState(
    data?.toneDescription || ''
  );
  const [sampleContent, setSampleContent] = useState(
    data?.sampleContent || ''
  );
  const [platforms, setPlatforms] = useState<string[]>(
    data?.platforms || []
  );
  const [isDefault, setIsDefault] = useState(data?.isDefault || false);

  const togglePlatform = useCallback(
    (platform: string) => {
      setPlatforms((prev) =>
        prev.includes(platform)
          ? prev.filter((p) => p !== platform)
          : [...prev, platform]
      );
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!toneName.trim()) {
        toast.show('Please enter a tone name', 'warning');
        return;
      }
      const body = {
        toneName: toneName.trim(),
        toneDescription: toneDescription.trim() || undefined,
        sampleContent: sampleContent.trim() || undefined,
        platforms,
        isDefault,
      };
      await fetch(
        data?.id
          ? `/user/voice-profiles/${data.id}`
          : '/user/voice-profiles',
        {
          method: data?.id ? 'PUT' : 'POST',
          body: JSON.stringify(body),
        }
      );
      toast.show(
        data?.id
          ? 'Voice profile updated successfully'
          : 'Voice profile created successfully',
        'success'
      );
      modal.closeCurrent();
      reload();
    },
    [toneName, toneDescription, sampleContent, platforms, isDefault, data]
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative flex gap-[16px] flex-col flex-1 rounded-[4px] pt-0">
        <div className="flex flex-col gap-[4px]">
          <label className="text-sm font-medium">
            {t('tone_name', 'Tone Name')} *
          </label>
          <input
            type="text"
            value={toneName}
            onChange={(e) => setToneName(e.target.value)}
            placeholder="e.g. Professional, Casual, Thought Leader"
            maxLength={100}
            className="bg-input border border-fifth rounded-[4px] p-[8px] outline-none text-textColor"
          />
        </div>

        <div className="flex flex-col gap-[4px]">
          <label className="text-sm font-medium">
            {t('tone_description', 'Tone Description')}
          </label>
          <textarea
            value={toneDescription}
            onChange={(e) => setToneDescription(e.target.value)}
            placeholder="Describe your voice style: formal vs casual, use of humor, sentence length preferences, vocabulary level..."
            maxLength={2000}
            rows={3}
            className="bg-input border border-fifth rounded-[4px] p-[8px] outline-none text-textColor resize-y"
          />
        </div>

        <div className="flex flex-col gap-[4px]">
          <label className="text-sm font-medium">
            {t('sample_content', 'Sample Content')}
          </label>
          <textarea
            value={sampleContent}
            onChange={(e) => setSampleContent(e.target.value)}
            placeholder="Paste 2-3 example posts in your voice so AI agents can learn your style..."
            maxLength={5000}
            rows={5}
            className="bg-input border border-fifth rounded-[4px] p-[8px] outline-none text-textColor resize-y"
          />
        </div>

        <div className="flex flex-col gap-[4px]">
          <label className="text-sm font-medium">
            {t('target_platforms', 'Target Platforms')}
          </label>
          <div className="flex flex-wrap gap-[8px]">
            {AVAILABLE_PLATFORMS.map((platform) => (
              <label
                key={platform}
                className={clsx(
                  'flex items-center gap-[6px] cursor-pointer px-[10px] py-[4px] rounded-[4px] border text-sm',
                  platforms.includes(platform)
                    ? 'border-buttonColor bg-buttonColor/10 text-textColor'
                    : 'border-fifth text-customColor18'
                )}
              >
                <input
                  type="checkbox"
                  checked={platforms.includes(platform)}
                  onChange={() => togglePlatform(platform)}
                  className="hidden"
                />
                {platform}
              </label>
            ))}
          </div>
          <span className="text-xs text-customColor18">
            {t(
              'platforms_help',
              'Leave empty to use this voice on all platforms'
            )}
          </span>
        </div>

        <div className="flex items-center gap-[8px]">
          <label className="flex items-center gap-[8px] cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-[16px] h-[16px]"
            />
            <span className="text-sm font-medium">
              {t('set_as_default', 'Set as default voice profile')}
            </span>
          </label>
        </div>

        <Button type="submit">{t('save', 'Save')}</Button>
      </div>
    </form>
  );
};
