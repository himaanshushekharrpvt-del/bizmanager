package com.bizmanager.security;

import com.bizmanager.common.Permission;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    private final Key key;
    private final long expirationMs;

    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                   @Value("${app.jwt.expiration-ms}") long expirationMs) {
        // Pad/hash short secrets so this doesn't blow up if someone shortens the default in properties.
        byte[] keyBytes = secret.getBytes();
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            keyBytes = padded;
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(AuthenticatedUser user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setSubject(String.valueOf(user.getUserId()))
                .claim("businessId", user.getBusinessId())
                .claim("phone", user.getPhone())
                .claim("name", user.getName())
                .claim("roleId", user.getRoleId())
                .claim("roleName", user.getRoleName())
                .claim("adminLevel", user.isAdminLevel())
                .claim("masterAdmin", user.isMasterAdmin())
                .claim("permissions", user.getPermissions().stream().map(Enum::name).collect(Collectors.toList()))
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    @SuppressWarnings("unchecked")
    public AuthenticatedUser toAuthenticatedUser(Claims claims) {
        List<String> permissionNames = claims.get("permissions", List.class);
        Set<Permission> permissions = permissionNames == null ? Set.of() :
                permissionNames.stream().map(Permission::valueOf).collect(Collectors.toSet());

        return new AuthenticatedUser(
                Long.parseLong(claims.getSubject()),
                claims.get("businessId", Long.class),
                claims.get("phone", String.class),
                claims.get("name", String.class),
                claims.get("roleId", Long.class),
                claims.get("roleName", String.class),
                Boolean.TRUE.equals(claims.get("adminLevel", Boolean.class)),
                Boolean.TRUE.equals(claims.get("masterAdmin", Boolean.class)),
                permissions
        );
    }
}
