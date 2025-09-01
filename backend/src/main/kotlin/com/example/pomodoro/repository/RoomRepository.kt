package com.example.pomodoro.repository

import com.example.pomodoro.entity.Room
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface RoomRepository : JpaRepository<Room, String> {
    fun findByHostId(hostId: UUID): List<Room>
    
    @Modifying
    @Query("DELETE FROM Room r WHERE r.createdAt < :cutoffTime")
    fun deleteOldRooms(cutoffTime: java.time.LocalDateTime): Int
}
