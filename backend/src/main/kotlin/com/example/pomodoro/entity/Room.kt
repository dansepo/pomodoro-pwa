package com.example.pomodoro.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "rooms")
data class Room(
    @Id
    @Column(length = 6)
    val id: String,
    
    @Column(name = "host_id", nullable = false)
    val hostId: UUID,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "timer_state", nullable = false)
    val timerState: TimerState = TimerState.FOCUS,
    
    @Column(name = "time_left", nullable = false)
    val timeLeft: Int = 1500,
    
    @Column(name = "is_running", nullable = false)
    val isRunning: Boolean = false,
    
    @Column(name = "completed_cycles", nullable = false)
    val completedCycles: Int = 0,
    
    @Column(name = "focus_time", nullable = false)
    val focusTime: Int = 25,
    
    @Column(name = "short_break_time", nullable = false)
    val shortBreakTime: Int = 5,
    
    @Column(name = "long_break_time", nullable = false)
    val longBreakTime: Int = 15,
    
    @Column(name = "created_at")
    val createdAt: LocalDateTime = LocalDateTime.now(),
    
    @Column(name = "updated_at")
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class TimerState {
    FOCUS, SHORT_BREAK, LONG_BREAK
}
