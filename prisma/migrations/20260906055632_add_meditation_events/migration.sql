-- AlterTable
ALTER TABLE `attendance_logs` ADD COLUMN `event_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `meditation_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `required_hours` DOUBLE NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `meditation_events_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `attendance_logs_event_id_idx` ON `attendance_logs`(`event_id`);

-- AddForeignKey
ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `meditation_events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
