package com.example.pomodoro.service

import com.example.pomodoro.dto.*
import com.example.pomodoro.entity.*
import com.example.pomodoro.repository.*
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.*
import kotlin.random.Random

@Service
@Transactional
class RoomService(
    private val roomRepository: RoomRepository,
    private val userRepository: UserRepository,
    private val roomParticipantRepository: RoomParticipantRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {
    
    fun createRoom(request: CreateRoomRequest): RoomResponse {
        val user = userRepository.save(User(name = request.userName))
        val roomId = generateRoomCode()
        
        val room = roomRepository.save(
            Room(
                id = roomId,
                hostId = user.id
            )
        )
        
        roomParticipantRepository.save(
            RoomParticipant(
                roomId = roomId,
                userId = user.id,
                isHost = true
            )
        )
        
        return getRoomResponse(room)
    }
    
    fun joinRoom(request: JoinRoomRequest): RoomResponse {
        val room = roomRepository.findById(request.roomId)
            .orElseThrow { IllegalArgumentException("Room not found") }
        
        val user = userRepository.save(User(name = request.userName))
        
        val existingParticipant = roomParticipantRepository.findByRoomIdAndUserId(request.roomId, user.id)
        if (existingParticipant == null) {
            roomParticipantRepository.save(
                RoomParticipant(
                    roomId = request.roomId,
                    userId = user.id,
                    isHost = false
                )
            )
        }
        
        val response = getRoomResponse(room)
        messagingTemplate.convertAndSend("/topic/room/${request.roomId}", response)
        return response
    }
    
    fun updateTimer(roomId: String, userId: UUID, request: UpdateTimerRequest): RoomResponse {
        val room = roomRepository.findById(roomId)
            .orElseThrow { IllegalArgumentException("Room not found") }
        
        val participant = roomParticipantRepository.findByRoomIdAndUserId(roomId, userId)
            ?: throw IllegalArgumentException("User not in room")
        
        if (!participant.isHost) {
            throw IllegalArgumentException("Only host can update timer")
        }
        
        val updatedRoom = room.copy(
            timerState = request.timerState ?: room.timerState,
            timeLeft = request.timeLeft ?: room.timeLeft,
            isRunning = request.isRunning ?: room.isRunning,
            completedCycles = request.completedCycles ?: room.completedCycles,
            focusTime = request.focusTime ?: room.focusTime,
            shortBreakTime = request.shortBreakTime ?: room.shortBreakTime,
            longBreakTime = request.longBreakTime ?: room.longBreakTime,
            updatedAt = LocalDateTime.now()
        )
        
        roomRepository.save(updatedRoom)
        
        val response = getRoomResponse(updatedRoom)
        messagingTemplate.convertAndSend("/topic/room/$roomId", response)
        return response
    }
    
    fun leaveRoom(roomId: String, userId: UUID) {
        roomParticipantRepository.deleteByRoomIdAndUserId(roomId, userId)
        
        val remainingParticipants = roomParticipantRepository.findByRoomId(roomId)
        if (remainingParticipants.isEmpty()) {
            roomRepository.deleteById(roomId)
        }
        
        val room = roomRepository.findById(roomId)
        if (room.isPresent) {
            val response = getRoomResponse(room.get())
            messagingTemplate.convertAndSend("/topic/room/$roomId", response)
        }
    }
    
    fun updateHeartbeat(roomId: String, userId: UUID) {
        val participant = roomParticipantRepository.findByRoomIdAndUserId(roomId, userId)
        if (participant != null) {
            roomParticipantRepository.save(
                participant.copy(lastSeen = LocalDateTime.now())
            )
        }
    }
    
    private fun getRoomResponse(room: Room): RoomResponse {
        val participants = roomParticipantRepository.findByRoomId(room.id)
        val users = userRepository.findAllById(participants.map { it.userId })
        
        val members = participants.mapNotNull { participant ->
            users.find { it.id == participant.userId }?.let { user ->
                MemberInfo(
                    id = user.id,
                    name = user.name,
                    isHost = participant.isHost,
                    lastSeen = participant.lastSeen.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                )
            }
        }
        
        return RoomResponse(
            id = room.id,
            hostId = room.hostId,
            timerState = room.timerState,
            timeLeft = room.timeLeft,
            isRunning = room.isRunning,
            completedCycles = room.completedCycles,
            settings = TimerSettings(
                focusTime = room.focusTime,
                shortBreakTime = room.shortBreakTime,
                longBreakTime = room.longBreakTime
            ),
            members = members
        )
    }
    
    private fun generateRoomCode(): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return (1..6)
            .map { chars[Random.nextInt(chars.length)] }
            .joinToString("")
    }
}
