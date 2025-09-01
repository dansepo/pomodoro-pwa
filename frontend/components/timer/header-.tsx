import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { RotateCcw, BarChart3, Settings, Users, NotebookPen } from "lucide-react";
import type {
  GroupSession,
  GroupMember,
  TimelineCycle,
  Note
} from "../pomodoro-timer";
import { GroupSessionDialog } from "@/components/timer/group-session-dialog";

interface HeaderProps {
  resetTimer: () => void;
  setIsNotepadOpen: (arg: (p: boolean) => boolean) => void;
  isTimelineOpen: boolean;
  setIsTimelineOpen: (open: boolean) => void;
  timelineData: TimelineCycle[];
  timelineFilter: string;
  setTimelineFilter: (filter: string) => void;
  uniqueCycleNames: string[];
  isGroupSheetOpen: boolean;
  setIsGroupSheetOpen: (open: boolean) => void;
  isGroupMode: boolean;
  groupSession: GroupSession | null;
  currentUser: GroupMember | null;
  userName: string;
  setUserName: (name: string) => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
  createGroupSession: () => void;
  joinGroupSession: () => void;
  leaveGroup: () => void;
  copyRoomCode: () => void;
  setIsSettingsOpen: (open: boolean) => void;
}

export function TimerHeader({
  resetTimer,
  setIsNotepadOpen,
  isTimelineOpen,
  setIsTimelineOpen,
  timelineData,
  timelineFilter,
  setTimelineFilter,
  uniqueCycleNames,
  isGroupSheetOpen,
  setIsGroupSheetOpen,
  isGroupMode,
  groupSession,
  currentUser,
  userName,
  setUserName,
  joinCode,
  setJoinCode,
  createGroupSession,
  joinGroupSession,
  leaveGroup,
  copyRoomCode,
  setIsSettingsOpen,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 md:p-6 w-full max-w-4xl mx-auto">
      <Button variant="ghost" size="icon" onClick={resetTimer} className="hover:bg-black/5 rounded-full">
        <RotateCcw className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
      </Button>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setIsNotepadOpen(prev => !prev)} className="hover:bg-black/5 rounded-full">
          <NotebookPen className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
        </Button>

        <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-black/5 rounded-full">
              <BarChart3 className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl md:max-w-3xl lg:max-w-4xl h-[70vh]">
            <DialogHeader>
              <DialogTitle>히스토리</DialogTitle>
            </DialogHeader>
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
                      <p className="text-sm text-slate-500 mb-2">
                        {new Date(cycle.id).toLocaleString()}
                      </p>
                      <div className="mt-2 space-y-2 pl-4 border-l-2 border-slate-200">
                        {cycle.notes.length > 0 ? cycle.notes.map(note => (
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
          </DialogContent>
        </Dialog>

        <Dialog open={isGroupSheetOpen} onOpenChange={setIsGroupSheetOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-black/5 rounded-full">
              <Users className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
              {isGroupMode && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  {groupSession?.members.length || 0}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                그룹 세션
              </DialogTitle>
            </DialogHeader>
            <GroupSessionDialog
              isGroupMode={isGroupMode}
              groupSession={groupSession}
              currentUser={currentUser}
              userName={userName}
              setUserName={setUserName}
              joinCode={joinCode}
              setJoinCode={setJoinCode}
              createGroupSession={createGroupSession}
              joinGroupSession={joinGroupSession}
              leaveGroup={leaveGroup}
              copyRoomCode={copyRoomCode}
            />
          </DialogContent>
        </Dialog>

        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="hover:bg-black/5 rounded-full">
          <Settings className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
        </Button>
      </div>
    </header>
  )
}
