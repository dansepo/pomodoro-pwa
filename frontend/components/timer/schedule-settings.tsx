import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { Schedule, TimerSettings } from '@/types';

interface ScheduleSettingsProps {
    schedules: Schedule[];
    onAdd: (schedule: Omit<Schedule, 'id'>) => void;
    onUpdate: (schedule: Schedule) => void;
    onDelete: (id: string) => void;
    currentSettings: TimerSettings;
    currentSound: string;
}

const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

export function ScheduleSettings({ schedules, onAdd, onUpdate, onDelete, currentSettings, currentSound }: ScheduleSettingsProps) {
    const [newTime, setNewTime] = useState('09:00');
    const [newDays, setNewDays] = useState<number[]>([]);
    const [newScheduleSettings, setNewScheduleSettings] = useState<TimerSettings>(currentSettings);
    const [newScheduleSound, setNewScheduleSound] = useState<string>(currentSound);

    const handleAddSchedule = () => {
        if (newTime && newDays.length > 0) {
            onAdd({
                time: newTime,
                days: newDays.sort(),
                enabled: true,
                settings: newScheduleSettings,
                sound: newScheduleSound,
            });
            setNewDays([]);
        }
    };

    const toggleDay = (dayIndex: number) => {
        setNewDays(prev =>
            prev.includes(dayIndex)
                ? prev.filter(d => d !== dayIndex)
                : [...prev, dayIndex]
        );
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-base font-semibold">자동 시작 스케줄</h3>
                <div className="p-3 border rounded-lg space-y-3 mt-2">
                    {schedules.map(schedule => (
                        <div key={schedule.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={schedule.enabled}
                                    onCheckedChange={(checked) => onUpdate({ ...schedule, enabled: checked })}
                                />
                                <div>
                                    <p className="font-mono text-sm">{schedule.time}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {schedule.days.map(d => daysOfWeek[d]).join(', ')}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(schedule.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {schedules.length === 0 && (
                        <p className="text-xs text-center text-muted-foreground py-2">설정된 스케줄이 없습니다.</p>
                    )}
                </div>
            </div>

            <div className="space-y-3 p-3 border rounded-lg">
                <h4 className="text-sm font-medium">새 스케줄 등록</h4>
                <p className="text-xs text-muted-foreground">
                    여기에 등록된 시간, 요일, 설정으로 타이머가 자동으로 시작됩니다.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="time" className="text-xs">시간</Label>
                        <Input id="time" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="h-9 mt-1" />
                    </div>
                    <div className="space-y-1 col-span-2">
                        <Label className="text-xs">요일</Label>
                        <div className="flex items-center gap-1 mt-1">
                            {daysOfWeek.map((day, index) => (<Button key={day} variant={newDays.includes(index) ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => toggleDay(index)}>{day}</Button>))}
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="focusTime" className="text-xs">집중 (분)</Label>
                        <Input
                            id="focusTime"
                            type="number"
                            value={newScheduleSettings.focusTime}
                            onChange={(e) => setNewScheduleSettings(s => ({ ...s, focusTime: Number(e.target.value) }))}
                            className="h-9 mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="breakTime" className="text-xs">휴식 (분)</Label>
                        <Input
                            id="breakTime"
                            type="number"
                            min="0"
                            value={newScheduleSettings.breakTime}
                            onChange={(e) => setNewScheduleSettings(s => ({ ...s, breakTime: Math.max(0, Number(e.target.value)) }))}
                            className="h-9 mt-1"
                        />
                    </div>
                    <div className="col-span-2">
                        <Label className="text-xs">알림음</Label>
                        <Select value={newScheduleSound} onValueChange={setNewScheduleSound}>
                            <SelectTrigger className="h-9 mt-1">
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
                </div>
                <Button onClick={handleAddSchedule} className="w-full h-9"><Plus className="h-4 w-4 mr-2" />스케줄 등록</Button>
            </div>
        </div>
    );
}