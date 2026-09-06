-- AlterTable
ALTER TABLE `attendance_logs` ADD COLUMN `is_late` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `session_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `event_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `event_sessions_event_id_idx`(`event_id`),
    INDEX `event_sessions_start_time_end_time_idx`(`start_time`, `end_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `attendance_logs_session_id_idx` ON `attendance_logs`(`session_id`);

-- AddForeignKey
ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `event_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_sessions` ADD CONSTRAINT `event_sessions_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `meditation_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
