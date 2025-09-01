package com.example.pomodoro.controller

import com.example.pomodoro.dto.*
import com.example.pomodoro.service.RoomService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = ["http://localhost:3000"])
class RoomController(
    private val roomService: RoomService
) {
    
    @PostMapping
    fun createRoom(@RequestBody request: CreateRoomRequest): ResponseEntity<RoomResponse> {
        val room = roomService.createRoom(request)
        return ResponseEntity.ok(room)
    }
    
    @PostMapping("/join")
    fun joinRoom(@RequestBody request: JoinRoomRequest): ResponseEntity<RoomResponse> {
        return try {
            val room = roomService.joinRoom(request)
            ResponseEntity.ok(room)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }
    
    @PutMapping("/{roomId}/timer")
    fun updateTimer(
        @PathVariable roomId: String,
        @RequestParam userId: UUID,
        @RequestBody request: UpdateTimerRequest
    ): ResponseEntity<RoomResponse> {
        return try {
            val room = roomService.updateTimer(roomId, userId, request)
            ResponseEntity.ok(room)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }
    
    @DeleteMapping("/{roomId}/participants/{userId}")
    fun leaveRoom(
        @PathVariable roomId: String,
        @PathVariable userId: UUID
    ): ResponseEntity<Void> {
        roomService.leaveRoom(roomId, userId)
        return ResponseEntity.ok().build()
    }
    
    @PostMapping("/{roomId}/heartbeat")
    fun updateHeartbeat(
        @PathVariable roomId: String,
        @RequestParam userId: UUID
    ): ResponseEntity<Void> {
        roomService.updateHeartbeat(roomId, userId)
        return ResponseEntity.ok().build()
    }
}
