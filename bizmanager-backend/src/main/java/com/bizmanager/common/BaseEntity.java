package com.bizmanager.common;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Every entity gets: an id, and automatic "who/when" provenance, via Spring
 * Data JPA auditing (see AuditorAwareConfig). This is separate from - and
 * complementary to - the explicit AuditLog table: this gives you cheap
 * createdBy/updatedBy on EVERY row for free; AuditLog is for the
 * higher-detail "old value -> new value" trail on the actions that matter
 * most (price changes, restocks, role changes, etc).
 *
 * @SuperBuilder (not plain @Builder) is required here and on every subclass -
 * plain @Builder ignores inherited fields entirely, which would silently drop
 * businessId from every tenant-scoped entity's builder. Every concrete entity
 * below this in the hierarchy must also use @SuperBuilder, never @Builder.
 */
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(updatable = false)
    @JsonIgnore
    private Long createdByUserId;

    @LastModifiedBy
    @JsonIgnore
    private Long updatedByUserId;
}
