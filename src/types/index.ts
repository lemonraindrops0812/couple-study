export interface User {
  id: string
  email: string
  nickname: string
  avatar_url?: string
}

export interface StudySession {
  id: string
  user_id: string
  subject: string
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  date: string
  created_at: string
}

export interface LiveActivity {
  id: string
  user_id: string
  user_nickname: string
  subject: string
  start_time: string
  is_active: boolean
}

export interface Task {
  id: string
  user_id: string
  title: string
  date: string
  completed: boolean
  created_at: string
}

export interface DietRecord {
  id: string
  user_id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_name: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  weight_g: number | null
  created_at: string
}

export interface ExerciseRecord {
  id: string
  user_id: string
  date: string
  exercise_name: string
  weight_kg: number | null
  reps: number | null
  sets: number | null
  duration_minutes: number | null
  created_at: string
}

export interface MoodEntry {
  id: string
  user_id: string
  date: string
  mood: 1 | 2 | 3 | 4 | 5
  note: string
  created_at: string
}

export interface DashboardData {
  todayStudyMinutes: number
  todayStudyCount: number
  yesterdayStudyMinutes: number
  todayTasksDone: number
  todayTasksTotal: number
  dietCalories: number
  dietProtein: number
  dietCarbs: number
  dietFat: number
  exerciseMinutes: number
  exerciseCount: number
  streakDays: number
  partnerStreakDays: number
  subjectBreakdown: { name: string; minutes: number }[]
  hourlyData: { hour: string; minutes: number }[]
  partnerHourlyData: { hour: string; minutes: number }[]
  weeklyCombined: { day: string; sessions: number; tasks: number }[]
}
