import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type {
  TimerSettings
} from "@/components/pomodoro-timer";

interface SettingsDialogProps {
  settings: TimerSettings;
  onSettingsChange: (newSettings: Partial<TimerSettings>) => void;
  selectedSound: string;
  onSoundChange: (sound: string) => void;
  isEditable: boolean;
}

export function SettingsDialog({
  settings,
  onSettingsChange,
  selectedSound,
  onSoundChange,
  isEditable,
}: SettingsDialogProps) {
  return (
    <div className="space-y-4 pt-2">
      {!isEditable && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">그룹 세션에서는 방장만 설정을 변경할 수 있습니다.</p>
        </div>
      )}

      <div className="flex items-center flex-wrap gap-2">
        <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">집중</span>
        {[15, 25, 30, 45, 50, 60, 90].map((time) => (
          <Button
            key={time}
            variant={settings.focusTime === time ? "secondary" : "outline"}
            onClick={() => onSettingsChange({ focusTime: time })}
            className="h-7 px-2 text-xs"
            disabled={!isEditable}
          >
            {time}분
          </Button>
        ))}
      </div>

      <div className="flex items-center flex-wrap gap-2">
        <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">휴식</span>
        {[5, 10, 15, 20, 30, 45].map((time) => (
          <Button
            key={time}
            variant={settings.shortBreakTime === time ? "secondary" : "outline"}
            onClick={() => onSettingsChange({ shortBreakTime: time })}
            className="h-7 px-2 text-xs"
            disabled={!isEditable}
          >
            {time}분
          </Button>
        ))}
      </div>

      <Select
        value={selectedSound}
        onValueChange={onSoundChange}
        disabled={!isEditable}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue placeholder="알림음 선택..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="/notification.wav">기본음</SelectItem>
          <SelectItem value="/bell.wav">벨소리</SelectItem>
          <SelectItem value="/chime.wav">차임벨</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}