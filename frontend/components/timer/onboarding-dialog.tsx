import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const tourSteps = [
    {
        title: "뽀모도로 타이머에 오신 것을 환영합니다!",
        description: "이 앱을 최대한 활용하는 방법을 간단히 안내해 드릴게요. 이 투어는 언제든지 도움말(?) 메뉴에서 다시 볼 수 있습니다.",
    },
    {
        title: "핵심 타이머",
        description: "중앙의 큰 숫자가 남은 시간입니다. 이 숫자를 더블클릭하면 집중/휴식 시간을 빠르게 변경할 수 있습니다.",
    },
    {
        title: "세션 진행률",
        description: "타이머 아래의 진행률 표시줄은 현재 사이클의 진행 상태를 보여줍니다. 이 표시줄을 더블클릭하여 한 사이클에 포함될 세션 횟수를 조절할 수 있습니다.",
    },
    {
        title: "기본 컨트롤",
        description: "재생/일시정지 버튼으로 타이머를 제어하고, 리셋 버튼으로 현재 사이클을 초기화할 수 있습니다. 스페이스바로도 타이머를 제어할 수 있어요!",
    },
    {
        title: "추가 기능",
        description: "상단 아이콘들을 통해 메모장, 그룹 세션, 히스토리, 설정 등 다양한 추가 기능을 이용할 수 있습니다. 아이콘에 마우스를 올리면 단축키를 확인할 수 있습니다.",
    },
    {
        title: "시작할 준비가 되셨나요?",
        description: "이제 타이머를 사용해 생산성을 높여보세요. 집중과 휴식의 균형을 찾는 여정을 응원합니다!",
    },
];

interface OnboardingDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onComplete: () => void;
}

export function OnboardingDialog({ isOpen, onOpenChange, onComplete }: OnboardingDialogProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const step = tourSteps[currentStep];

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onComplete(); onOpenChange(open); }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{step.title}</DialogTitle>
                    <DialogDescription className="pt-2 min-h-[80px]">{step.description}</DialogDescription>
                </DialogHeader>
                <div className="flex justify-center items-center gap-2 my-4">
                    {tourSteps.map((_, index) => (<div key={index} className={`h-2 w-2 rounded-full transition-colors ${index === currentStep ? 'bg-primary' : 'bg-muted-foreground'}`} />))}
                </div>
                <DialogFooter>
                    <div className="w-full flex justify-between">
                        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}><ArrowLeft className="h-4 w-4 mr-2" />이전</Button>
                        <Button onClick={handleNext}>
                            {currentStep === tourSteps.length - 1 ? '시작하기' : '다음'}
                            {currentStep < tourSteps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}