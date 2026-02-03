import { Sun, Trophy, Medal, Star, Flame } from 'lucide-react-native';

export interface Badge {
    id: string;
    title: string;
    description: string;
    icon: any; // Lucide Icon Component
    color: string;
    requirement: number;
    type: 'streak' | 'total_prayers' | 'late_prayers' | 'fajr_streak';
}

export const BADGES: Badge[] = [
    {
        id: 'first_step',
        title: 'First Step',
        description: 'Complete your first full day of 5 prayers.',
        icon: Star,
        color: '#F6AD55', // Gold
        requirement: 1, // 1 Full Day (5 prayers)
        type: 'total_prayers', // We'll count "full days" or just total prayers = 5? Description says "first full day". Let's track "days with 5 prayers".
    },
    {
        id: 'fajr_warrior',
        title: 'Fajr Warrior',
        description: 'Pray Fajr on time for 7 days in a row.',
        icon: Sun,
        color: '#E53E3E', // Red/Orange
        requirement: 7,
        type: 'fajr_streak',
    },
    {
        id: 'late_but_present',
        title: 'Late but Present',
        description: 'Mark 10 prayers as Late. Consistency matters!',
        icon: Medal,
        color: '#319795', // Teal
        requirement: 10,
        type: 'late_prayers',
    },
    {
        id: 'streak_master',
        title: 'Streak Master',
        description: 'Resist the urge to break a 30 day streak.',
        icon: Flame,
        color: '#805AD5', // Purple
        requirement: 30,
        type: 'streak',
    }
];
