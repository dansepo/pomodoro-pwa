package com.example.pomodoro.repository

import com.example.pomodoro.entity.RoomParticipant
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.*

@Repository
interface RoomParticipantRepository : JpaRepository<RoomParticipant, UUID> {
    fun findByRoomId(roomId: String): List<RoomParticipant>
    fun findByRoomIdAndUserId(roomId: String, userId: UUID): RoomParticipant?
    fun deleteByRoomIdAndUserId(roomId: String, userId: UUID)
    
    @Modifying
    @Query("DELETE FROM RoomParticipant rp WHERE rp.lastSeen < :cutoffTime")
    fun deleteInactiveParticipants(cutoffTime: LocalDateTime): Int
}
