import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TimelineCycle, Note } from "@/components/pomodoro-timer";

interface HistoryDialogProps {
    timelineData: TimelineCycle[];
    timelineFilter: string;
    setTimelineFilter: (filter: string) => void;
    uniqueCycleNames: string[];
}

export function HistoryDialog({
    timelineData,
    timelineFilter,
    setTimelineFilter,
    uniqueCycleNames,
}: HistoryDialogProps) {
    return (
        <>
            <div className="flex items-center mb-4">
                <Label htmlFor="story-filter" className="mr-2 shrink-0">스토리 필터:</Label>
                <Select value={timelineFilter} onValueChange={setTimelineFilter}>
                    <SelectTrigger id="story-filter" className="w-full md:w-[280px]">
                        <SelectValue placeholder="필터할 스토리 선택..." />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueCycleNames.map(name => (
                            <SelectItem key={name} value={name}>
                                {name === "all" ? "모든 스토리 보기" : name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="h-full overflow-y-auto pr-4 -mr-4">
                {timelineData.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-slate-500">아직 기록된 세션이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {timelineData.map(cycle => (
                            <div key={cycle.id}>
                                <h3 className="font-bold text-lg">{cycle.name}</h3>
                                <p className="text-sm text-slate-500 mb-2">{new Date(cycle.id).toLocaleString()}</p>
                                <div className="mt-2 space-y-2 pl-4 border-l-2 border-slate-200">
                                    {cycle.notes.length > 0 ? cycle.notes.map((note: Note) => (
                                        <div key={note.id} className="bg-slate-100 p-3 rounded-md">
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{note.content}</p>
                                        </div>
                                    )) : <p className="text-sm text-slate-400 italic">이 세션에는 메모가 없습니다.</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

