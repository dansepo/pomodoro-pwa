package com.example.pomodoro.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "room_participants")
data class RoomParticipant(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "room_id", nullable = false, length = 6)
    val roomId: String,
    
    @Column(name = "user_id", nullable = false)
    val userId: UUID,
    
    @Column(name = "is_host", nullable = false)
    val isHost: Boolean = false,
    
    @Column(name = "last_seen")
    val lastSeen: LocalDateTime = LocalDateTime.now(),
    
    @Column(name = "joined_at")
    val joinedAt: LocalDateTime = LocalDateTime.now()
)
