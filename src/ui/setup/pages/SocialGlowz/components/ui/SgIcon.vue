<template>
  <component
    :is="resolvedIcon"
    v-if="resolvedIcon"
    :class="componentClass"
    aria-hidden="true"
  />
  <span
    v-else
    :class="fallbackClass"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import IconPhArchive from '~icons/ph/archive'
import IconPhArrowLeft from '~icons/ph/arrow-left'
import IconPhArrowRight from '~icons/ph/arrow-right'
import IconPhArrowsClockwise from '~icons/ph/arrows-clockwise'
import IconPhAppWindow from '~icons/ph/app-window'
import IconPhArrowSquareOut from '~icons/ph/arrow-square-out'
import IconPhBell from '~icons/ph/bell'
import IconPhBellSlash from '~icons/ph/bell-slash'
import IconPhBookMark from '~icons/ph/bookmark'
import IconPhBriefcase from '~icons/ph/briefcase'
import IconPhBugBeetle from '~icons/ph/bug-beetle'
import IconPhBuilding from '~icons/ph/building'
import IconPhCalendar from '~icons/ph/calendar'
import IconPhCamera from '~icons/ph/camera'
import IconPhChartBar from '~icons/ph/chart-bar'
import IconPhCheck from '~icons/ph/check'
import IconPhCheckCircle from '~icons/ph/check-circle'
import IconPhCheckSquare from '~icons/ph/check-square'
import IconPhCircle from '~icons/ph/circle'
import IconPhCaretDown from '~icons/ph/caret-down'
import IconPhCaretRight from '~icons/ph/caret-right'
import IconPhCaretUp from '~icons/ph/caret-up'
import IconPhChat from '~icons/ph/chat'
import IconPhChatCentered from '~icons/ph/chat-centered'
import IconPhCopy from '~icons/ph/copy'
import IconPhAt from '~icons/ph/at'
import IconPhLightning from '~icons/ph/lightning'
import IconPhMegaphone from '~icons/ph/megaphone'
import IconPhQuestion from '~icons/ph/question'
import IconPhSparkle from '~icons/ph/sparkle'
import IconPhInstagramLogo from '~icons/ph/instagram-logo'
import IconPhDiscordLogo from '~icons/ph/discord-logo'
import IconPhTiktokLogo from '~icons/ph/tiktok-logo'
import IconPhTelegramLogo from '~icons/ph/telegram-logo'
import IconPhRedditLogo from '~icons/ph/reddit-logo'
import IconPhTwitterLogo from '~icons/ph/twitter-logo'
import IconPhPinterestLogo from '~icons/ph/pinterest-logo'
import IconPhGoogleLogo from '~icons/ph/google-logo'
import IconPhFacebookLogo from '~icons/ph/facebook-logo'
import IconPhLinkedinLogo from '~icons/ph/linkedin-logo'
import IconPhDatabase from '~icons/ph/database'
import IconPhDesktop from '~icons/ph/desktop'
import IconPhDotsThree from '~icons/ph/dots-three'
import IconPhEnvelope from '~icons/ph/envelope'
import IconPhEnvelopeSimple from '~icons/ph/envelope-simple'
import IconPhEraser from '~icons/ph/eraser'
import IconPhEye from '~icons/ph/eye'
import IconPhEyeSlash from '~icons/ph/eye-slash'
import IconPhHandWithdraw from '~icons/ph/hand-withdraw'
import IconPhFile from '~icons/ph/file'
import IconPhFunnel from '~icons/ph/funnel'
import IconPhFunnelX from '~icons/ph/funnel-x'
import IconPhGift from '~icons/ph/gift'
import IconPhGear from '~icons/ph/gear'
import IconPhHash from '~icons/ph/hash'
import IconPhGlobe from '~icons/ph/globe'
import IconPhHeart from '~icons/ph/heart'
import IconPhHeartStraight from '~icons/ph/heart-straight'
import IconPhHouse from '~icons/ph/house'
import IconPhImage from '~icons/ph/image'
import IconPhInfo from '~icons/ph/info'
import IconPhKeyboard from '~icons/ph/keyboard'
import IconPhKey from '~icons/ph/key'
import IconPhLink from '~icons/ph/link'
import IconPhList from '~icons/ph/list'
import IconPhLock from '~icons/ph/lock'
import IconPhLockOpen from '~icons/ph/lock-open'
import IconPhMailbox from '~icons/ph/mailbox'
import IconPhMapPin from '~icons/ph/map-pin'
import IconPhMagnifyingGlass from '~icons/ph/magnifying-glass'
import IconPhMagnifyingGlassPlus from '~icons/ph/magnifying-glass-plus'
import IconPhMoon from '~icons/ph/moon'
import IconPhPalette from '~icons/ph/palette'
import IconPhPaperPlaneRight from '~icons/ph/paper-plane-right'
import IconPhPencil from '~icons/ph/pencil'
import IconPhPlay from '~icons/ph/play'
import IconPhPlus from '~icons/ph/plus'
import IconPhDeviceMobile from '~icons/ph/device-mobile'
import IconPhShare from '~icons/ph/share'
import IconPhShuffle from '~icons/ph/shuffle'
import IconPhShieldCheck from '~icons/ph/shield-check'
import IconPhSignOut from '~icons/ph/sign-out'
import IconPhSlidersHorizontal from '~icons/ph/sliders-horizontal'
import IconPhSmiley from '~icons/ph/smiley'
import IconPhSmileySad from '~icons/ph/smiley-sad'
import IconPhSpinner from '~icons/ph/spinner-gap'
import IconPhSquaresFour from '~icons/ph/squares-four'
import IconPhSpeakerHigh from '~icons/ph/speaker-high'
import IconPhSpeakerLow from '~icons/ph/speaker-low'
import IconPhThumbsUp from '~icons/ph/thumbs-up'
import IconPhTrash from '~icons/ph/trash'
import IconPhYoutube from '~icons/ph/youtube-logo'
import IconPhWarning from '~icons/ph/warning'
import IconPhWarningCircle from '~icons/ph/warning-circle'
import IconPhTriangle from '~icons/ph/triangle'
import IconPhX from '~icons/ph/x'
import IconPhXCircle from '~icons/ph/x-circle'
import IconPhUser from '~icons/ph/user'
import IconPhUsers from '~icons/ph/users'
import IconPhVideoCamera from '~icons/ph/video-camera'

type IconInput = string | string[] | unknown[]

const props = defineProps<{ icon?: IconInput }>()

const legacyToIconMap: Record<string, Component> = {
  'pi': IconPhHandWithdraw,
  'pi-at': IconPhAt,
  'pi-arrow-left': IconPhArrowLeft,
  'pi-arrow-right': IconPhArrowRight,
  'pi-archive': IconPhArchive,
  'pi-bars': IconPhList,
  'pi-bolt': IconPhLightning,
  'pi-bell': IconPhBell,
  'pi-bell-slash': IconPhBellSlash,
  'pi-bookmark': IconPhBookMark,
  'pi-briefcase': IconPhBriefcase,
  'pi-bug': IconPhBugBeetle,
  'pi-building': IconPhBuilding,
  'pi-calendar': IconPhCalendar,
  'pi-camera': IconPhCamera,
  'pi-chart-bar': IconPhChartBar,
  'pi-circle': IconPhCircle,
  'pi-check': IconPhCheck,
  'pi-check-circle': IconPhCheckCircle,
  'pi-check-square': IconPhCheckSquare,
  'pi-chevron-down': IconPhCaretDown,
  'pi-chevron-right': IconPhCaretRight,
  'pi-chevron-up': IconPhCaretUp,
  'pi-cloud': IconPhGlobe,
  'pi-code': IconPhPencil,
  'pi-comment': IconPhChat,
  'pi-comments': IconPhChatCentered,
  'pi-copy': IconPhCopy,
  'pi-cog': IconPhGear,
  'pi-database': IconPhDatabase,
  'pi-desktop': IconPhDesktop,
  'pi-ellipsis-h': IconPhDotsThree,
  'pi-envelope': IconPhEnvelopeSimple ?? IconPhEnvelope,
  'pi-eraser': IconPhEraser,
  'pi-exclamation-circle': IconPhWarningCircle,
  'pi-exclamation-triangle': IconPhTriangle,
  'pi-external-link': IconPhArrowSquareOut,
  'pi-eye': IconPhEye,
  'pi-eye-slash': IconPhEyeSlash,
  'pi-facebook': IconPhFacebookLogo,
  'pi-float-center': IconPhShuffle,
  'pi-file': IconPhFile,
  'pi-flask': IconPhBugBeetle,
  'pi-filter': IconPhFunnel,
  'pi-filter-fill': IconPhFunnel,
  'pi-filter-slash': IconPhFunnelX,
  'pi-frown': IconPhSmileySad,
  'pi-gift': IconPhGift,
  'pi-globe': IconPhGlobe,
  'pi-google': IconPhGoogleLogo,
  'pi-hashtag': IconPhHash,
  'pi-heart': IconPhHeart,
  'pi-heart-fill': IconPhHeartStraight,
  'pi-home': IconPhHouse,
  'pi-image': IconPhImage,
  'pi-inbox': IconPhMailbox,
  'pi-info-circle': IconPhInfo,
  'pi-key': IconPhKey,
  'pi-keyboard': IconPhKeyboard,
  'pi-link': IconPhLink,
  'pi-linkedin': IconPhLinkedinLogo,
  'pi-list': IconPhList,
  'pi-lock': IconPhLock,
  'pi-lock-open': IconPhLockOpen,
  'pi-map-marker': IconPhMapPin,
  'pi-megaphone': IconPhMegaphone,
  'pi-mobile': IconPhDeviceMobile,
  'pi-moon': IconPhMoon,
  'pi-palette': IconPhPalette,
  'pi-pencil': IconPhPencil,
  'pi-play': IconPhPlay,
  'pi-plus': IconPhPlus,
  'pi-question-circle': IconPhQuestion,
  'pi-reddit': IconPhRedditLogo,
  'pi-instagram': IconPhInstagramLogo,
  'pi-discord': IconPhDiscordLogo,
  'pi-tiktok': IconPhTiktokLogo,
  'pi-telegram': IconPhTelegramLogo,
  'pi-pinterest': IconPhPinterestLogo,
  'pi-refresh': IconPhArrowsClockwise,
  'pi-replay': IconPhArrowsClockwise,
  'pi-search': IconPhMagnifyingGlass,
  'pi-search-plus': IconPhMagnifyingGlassPlus,
  'pi-sparkles': IconPhSparkle,
  'pi-shield': IconPhShieldCheck,
  'pi-spinner': IconPhSpinner,
  'pi-send': IconPhPaperPlaneRight,
  'pi-share-alt': IconPhShare,
  'pi-shield-check': IconPhShieldCheck,
  'pi-volume-down': IconPhSpeakerLow,
  'pi-volume-up': IconPhSpeakerHigh,
  'pi-sign-out': IconPhSignOut,
  'pi-sliders-h': IconPhSlidersHorizontal,
  'pi-smile': IconPhSmiley,
  'pi-spin': IconPhSpinner,
  'pi-th-large': IconPhSquaresFour,
  'pi-thumbs-up': IconPhThumbsUp,
  'pi-times': IconPhX,
  'pi-times-circle': IconPhXCircle,
  'pi-trash': IconPhTrash,
  'pi-twitter': IconPhTwitterLogo,
  'pi-youtube': IconPhYoutube,
  'pi-user': IconPhUser,
  'pi-users': IconPhUsers,
  'pi-video': IconPhVideoCamera,
  'pi-window-maximize': IconPhAppWindow,
}

const toTokenArray = (raw: IconInput): string[] => {
  if (raw == null) return []
  if (typeof raw === 'string') return raw.trim().split(/\s+/g).filter(Boolean)
  if (Array.isArray(raw)) {
    return raw.flatMap((value) => {
      if (typeof value === 'string') {
        return value.trim().split(/\s+/g).filter(Boolean)
      }
      return []
    })
  }
  return []
}

const iconTokens = computed(() => toTokenArray(props.icon as IconInput))

const legacyToken = computed(() => iconTokens.value.find((token) => token.startsWith('pi-')) ?? null)

const isSpinning = computed(() => iconTokens.value.includes('pi-spin'))

const resolvedIcon = computed(() => {
  if (!legacyToken.value) return null
  return legacyToIconMap[legacyToken.value] ?? null
})

const nonLegacyClassTokens = computed(() => {
  return iconTokens.value.filter((token) => !token.startsWith('pi-'))
})

const fallbackClass = computed(() => {
  if (!resolvedIcon.value) {
    return iconTokens.value
  }
  return nonLegacyClassTokens.value
})

const componentClass = computed(() => {
  const classes = ['sg-icon', ...nonLegacyClassTokens.value]
  if (isSpinning.value) classes.push('sg-icon--spin')
  return classes
})
</script>

<style scoped>
.sg-icon {
  display: inline-block;
  width: var(--sg-size-1em);
  height: var(--sg-size-1em);
  color: currentColor;
}

.sg-icon :deep(svg) {
  width: var(--sg-size-100pct);
  height: var(--sg-size-100pct);
}

.sg-icon--spin {
  animation: sg-icon-spin var(--sg-motion-transform-1s-linear-infinite);
}

@keyframes sg-icon-spin {
  to {
    transform: rotate(1turn);
  }
}
</style>
