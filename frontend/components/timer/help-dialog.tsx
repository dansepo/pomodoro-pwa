import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

const shortcuts = [
    { keys: ["Space"], description: "타이머 시작 / 일시정지" },
    { keys: ["?"], description: "도움말 보기" },
    { keys: ["Alt", "R"], description: "타이머 리셋" },
    { keys: ["Alt", "G"], description: "그룹 세션 창 열기/닫기" },
    { keys: ["Alt", "S"], description: "설정 창 열기/닫기" },
    { keys: ["Alt", "N"], description: "메모장 열기/닫기" },
    { keys: ["Alt", "M"], description: "알림음 켜기/끄기" },
    { keys: ["Alt", "T"], description: "히스토리 창 열기/닫기" },
]

interface HelpDialogProps {
    onStartTour: () => void;
}

export function HelpDialog({ onStartTour }: HelpDialogProps) {
    return (
        <Tabs defaultValue="usage" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="usage" className="h-full text-xs py-1">기본 사용법</TabsTrigger>
                <TabsTrigger value="shortcuts" className="h-full text-xs py-1">단축키</TabsTrigger>
            </TabsList>
            <TabsContent value="usage" className="pt-2">
                <div className="text-xs text-muted-foreground">
                    <ul className="list-disc list-inside space-y-1">
                        <li><Kbd>Space</Kbd> 키 또는 재생/일시정지 버튼으로 타이머를 시작/중지합니다.</li>
                        <li>타이머 숫자를 더블클릭하여 집중/휴식 시간을 빠르게 변경할 수 있습니다.</li>
                        <li>타이머 아래의 진행률 표시줄을 더블클릭하여 한 사이클의 세션 횟수를 변경할 수 있습니다.</li>
                        <li>알림음 아이콘을 더블클릭하여 소리 및 시간 상세 설정을 열 수 있습니다.</li>
                    </ul>
                </div>
            </TabsContent>
            <TabsContent value="shortcuts" className="pt-2">
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {shortcuts.map((shortcut) => (
                        <li key={shortcut.description} className="flex items-center justify-between">
                            <span>{shortcut.description}</span>
                            <div className="flex gap-1">{shortcut.keys.map(k => <Kbd key={k}>{k}</Kbd>)}</div>
                        </li>
                    ))}
                </ul>
            </TabsContent>
            <div className="mt-2 text-center">
                <Button variant="link" onClick={onStartTour} className="h-auto py-0 text-xs">앱 사용법 다시 보기</Button>
            </div>
        </Tabs>
    )
}