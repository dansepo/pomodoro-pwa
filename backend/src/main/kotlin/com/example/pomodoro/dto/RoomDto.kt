package com.example.pomodoro.dto

import com.example.pomodoro.entity.TimerState
import java.util.*

data class CreateRoomRequest(
    val userName: String
)

data class JoinRoomRequest(
    val roomId: String,
    val userName: String
)

data class UpdateTimerRequest(
    val timerState: TimerState? = null,
    val timeLeft: Int? = null,
    val isRunning: Boolean? = null,
    val completedCycles: Int? = null,
    val focusTime: Int? = null,
    val shortBreakTime: Int? = null,
    val longBreakTime: Int? = null
)

data class RoomResponse(
    val id: String,
    val hostId: UUID,
    val timerState: TimerState,
    val timeLeft: Int,
    val isRunning: Boolean,
    val completedCycles: Int,
    val settings: TimerSettings,
    val members: List<MemberInfo>
)

data class TimerSettings(
    val focusTime: Int,
    val shortBreakTime: Int,
    val longBreakTime: Int
)

data class MemberInfo(
    val id: UUID,
    val name: String,
    val isHost: Boolean,
    val lastSeen: String
)

data class UserResponse(
    val id: UUID,
    val name: String
)
