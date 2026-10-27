import React from 'react';
import {
  IconArrowsExchange, IconArrowRight, IconBuilding, IconBuildingCommunity,
  IconBuildingFactory, IconCamera, IconCheck, IconChevronDown, IconChevronLeft,
  IconChevronRight, IconChevronUp, IconCircle, IconClipboardList, IconDoor,
  IconDots, IconHome, IconHomeSearch, IconHomeShield, IconLayoutDashboard,
  IconList, IconMap, IconMapPin, IconMicrophone, IconMinus, IconPhone,
  IconPlayerStop, IconPlus, IconQrcode, IconSchool, IconSearch, IconSquare,
  IconTrash, IconUser, IconX, IconStorm, IconCloudRain, IconWind,
} from '@tabler/icons-react';

// Explicit imports keep the production bundle limited to the icons we use.
export const iconComponents = {
  'arrows-exchange': IconArrowsExchange, 'arrow-right': IconArrowRight,
  building: IconBuilding, 'building-community': IconBuildingCommunity,
  'building-factory': IconBuildingFactory, camera: IconCamera, check: IconCheck,
  'chevron-down': IconChevronDown, 'chevron-left': IconChevronLeft,
  'chevron-right': IconChevronRight, 'chevron-up': IconChevronUp,
  circle: IconCircle, 'clipboard-list': IconClipboardList, door: IconDoor,
  dots: IconDots, home: IconHome, 'home-search': IconHomeSearch,
  'home-shield': IconHomeShield, 'layout-dashboard': IconLayoutDashboard,
  list: IconList, map: IconMap, 'map-pin': IconMapPin, microphone: IconMicrophone,
  minus: IconMinus, phone: IconPhone, 'player-stop': IconPlayerStop, plus: IconPlus,
  qrcode: IconQrcode, school: IconSchool, search: IconSearch, square: IconSquare,
  trash: IconTrash, user: IconUser, x: IconX, storm: IconStorm, 'cloud-rain': IconCloudRain, wind: IconWind,
};

export function AppIcon({ name, size = 20, stroke = 1.5, label, className = '', ...props }) {
  const Icon = iconComponents[name];
  if (!Icon) throw new Error(`Unknown Tabler icon: ${name}`);
  return <Icon {...props} size={size} stroke={stroke} color="currentColor"
    className={`app-icon ${className}`.trim()} focusable="false"
    aria-hidden={label ? undefined : true} role={label ? 'img' : undefined}
    aria-label={label} />;
}
