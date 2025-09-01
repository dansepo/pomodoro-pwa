import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy } from "lucide-react"
import type { GroupSession, GroupMember } from "@/types"

interface GroupSessionDialogProps {
    isGroupMode: boolean
    groupSession: GroupSession | null
    currentUser: GroupMember | null
    userName: string
    setUserName: (name: string) => void
    joinCode: string
    setJoinCode: (code: string) => void
    createGroupSession: () => void
    joinGroupSession: () => void
    leaveGroup: () => void
    copyRoomCode: () => void
}

export function GroupSessionDialog({
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
}: GroupSessionDialogProps) {
    if (isGroupMode && groupSession) {
        // 그룹에 참여했을 때의 컴팩트한 UI
        return (
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-2 rounded-md border bg-slate-50 p-1.5 px-2.5">
                    <Label htmlFor="room-code" className="text-xs font-medium text-slate-600">참여 코드</Label>
                    <div className="flex items-center gap-2">
                        <code id="room-code" className="text-xs font-semibold">{groupSession.id}</code>
                        <Button variant="ghost" size="sm" onClick={copyRoomCode} className="h-7 px-2">
                            <Copy className="h-3 w-3 mr-1" />
                            복사
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">
                        참여 멤버 ({groupSession.members.length}명)
                    </Label>
                    <div className="max-h-48 overflow-y-auto rounded-md border">
                        <ul className="divide-y divide-slate-200">
                            {groupSession.members.map(member => (
                                <li key={member.id} className="flex items-center justify-between text-sm p-1.5 px-2.5">
                                    <span>{member.name}</span>
                                    {member.isHost && <Badge variant="secondary" className="h-5 text-xs">방장</Badge>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <Button onClick={leaveGroup} variant="outline" className="w-full h-8 text-xs">
                    그룹 나가기
                </Button>
            </div>
        )
    }

    // 그룹에 참여하기 전의 컴팩트한 UI
    return (
        <form onSubmit={(e) => { e.preventDefault(); joinGroupSession(); }}>
            <div className="space-y-3 pt-2">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2">
                    <Label htmlFor="name" className="text-xs">이름</Label>
                    <Input
                        id="name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="표시할 이름"
                        className="h-8 text-xs"
                    />
                    <Button type="button" onClick={createGroupSession} className="h-8 px-3 text-xs">만들기</Button>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">또는</span></div>
                </div>
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2">
                    <Label htmlFor="code" className="text-xs">참여 코드</Label>
                    <Input id="code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="참여 코드" className="h-8 text-xs" />
                    <Button type="submit" className="h-8 px-3 text-xs">참여</Button>
                </div>
            </div>
        </form>
    )
}