import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScheduleSettings } from "./schedule-settings"
import { useScheduler } from "@/hooks/use-scheduler"
import type { TimerSettings } from "@/types"

interface SettingsDialogProps {
  settings: TimerSettings
  onSettingsChange: (newSettings: Partial<TimerSettings>) => void
  selectedSound: string
  onSoundChange: (sound: string) => void
  isEditable: boolean
}

export function SettingsDialog({
  settings,
  onSettingsChange,
  selectedSound,
  onSoundChange,
  isEditable,
}: SettingsDialogProps) {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useScheduler();

  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-4">
        <h3 className="text-base font-semibold">시간 설정</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="focusTime" className="text-sm">집중 (분)</Label>
            <Input
              id="focusTime"
              type="number"
              value={settings.focusTime}
              onChange={(e) => onSettingsChange({ focusTime: Number(e.target.value) })}
              disabled={!isEditable}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="breakTime" className="text-sm">휴식 (분)</Label>
            <Input
              id="breakTime"
              type="number"
              min="0"
              value={settings.breakTime}
              onChange={(e) => onSettingsChange({ breakTime: Math.max(0, Number(e.target.value)) })}
              disabled={!isEditable}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">알림음 설정</h3>
        <Select value={selectedSound} onValueChange={onSoundChange}>
          <SelectTrigger>
            <SelectValue placeholder="알림음 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bell">Bell</SelectItem>
            <SelectItem value="bird">Bird</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
            <SelectItem value="kitchen">Kitchen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScheduleSettings
        schedules={schedules}
        onAdd={addSchedule}
        onUpdate={updateSchedule}
        onDelete={deleteSchedule}
        currentSettings={settings}
        currentSound={selectedSound}
      />
    </div>
  )
}