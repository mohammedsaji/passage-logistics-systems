package com.app.logistics.auth.authFilters;

import com.app.logistics.auth.authUtils.AuthDetails;
import com.app.logistics.auth.authUtils.AuthService;
import com.app.logistics.common.exception.APIException;
import com.app.logistics.auth.authUtils.BearerTokenBuilder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Stream;

@Component
public class CustomBearerToken extends OncePerRequestFilter {
    private final BearerTokenBuilder bearerTokenBuilder;
    private final AuthService authService;

    public CustomBearerToken(BearerTokenBuilder bearerTokenBuilder, AuthService authService) {
        this.bearerTokenBuilder = bearerTokenBuilder;
        this.authService = authService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/imgs/")
                || path.startsWith("/styles/")
                || path.startsWith("/js/")
                || path.startsWith("/views/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String servletPath = request.getServletPath();

        if (servletPath.equals("/logistic/account/signin")
                || servletPath.equals("/logistic/account/signup")
                || servletPath.equals("/logistic/shipment/tracking")
                || servletPath.equals("/logistic/account/password/forgot")
                || servletPath.equals("/logistic/account/password/reset")
                || servletPath.equals("/actuator/health")
                || servletPath.startsWith("/swagger-ui/")
                || servletPath.startsWith("/v3/api-docs/")
                || servletPath.startsWith("/views/")
                || servletPath.startsWith("/js/")
                || servletPath.startsWith("/styles/")
                || servletPath.equals("/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String bearerToken = extractBearerTokenFromCookie(request);

        if (bearerToken == null) {
            throw new APIException("Request Header provided may not have Authorization bearer token.", HttpStatus.FORBIDDEN);
        }

        if (!bearerToken.isBlank()) {
            Object[] claims = bearerTokenBuilder.parseBearerToken(bearerToken);
            if (claims != null && claims.length == 3) {
                String extractedUsername = (String) claims[0];
                String extractedRole = (String) claims[1];
                Date extractedExpirationTime = (Date) claims[2];
                AuthDetails authDetails = authService.loadUserByUsername(extractedUsername);
                if (!extractedUsername.isBlank() && extractedUsername.equals(authDetails.getUsername())) {
                    if (isAuthorized(authDetails.getAuthorities(), extractedRole)) {
                        if (extractedExpirationTime.getTime() > System.currentTimeMillis()) {
                            UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken =
                                    new UsernamePasswordAuthenticationToken(authDetails, null, authDetails.getAuthorities());
                            SecurityContext securityContext = SecurityContextHolder.getContext();
                            securityContext.setAuthentication(usernamePasswordAuthenticationToken);
                            filterChain.doFilter(request, response);
                        } else {
                            throw new APIException("Bearer token provided could be expired.", HttpStatus.FORBIDDEN);
                        }
                    } else {
                        throw new APIException("Bearer token requires necessary privilege.", HttpStatus.FORBIDDEN);
                    }
                } else {
                    throw new APIException("Bearer token provided could contain invalid username.", HttpStatus.FORBIDDEN);
                }
            } else {
                throw new APIException("Bearer token provided could be invalid.", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new APIException("Bearer token provided could be null.", HttpStatus.FORBIDDEN);
        }
    }

    public String extractBearerTokenFromCookie(HttpServletRequest request){

        Cookie[]  cookies = request.getCookies();

        if(cookies == null){
            throw new APIException("No cookies found.",HttpStatus.BAD_REQUEST);
        }

        return Stream.of(cookies)
                .filter(cookie -> cookie.getName().equals("AUTH-TOKEN"))
                .map(Cookie::getValue)
                .findFirst()
                .orElseThrow(new Supplier<APIException>() {
                    @Override
                    public APIException get() {
                        throw new APIException("Request header provided could have invalid bearer token format.", HttpStatus.FORBIDDEN);
                    }
                });
    }

    public Boolean isAuthorized(List<SimpleGrantedAuthority> authorityList, String extractedRole) {
        return authorityList.stream()
                .anyMatch(authority -> extractedRole.equals(authority.getAuthority()));
    }
}
