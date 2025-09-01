package com.example.pomodoro

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class PomodoroApplication

fun main(args: Array<String>) {
    runApplication<PomodoroApplication>(*args)
}
