package com.app.logistics.auth.authFilters;//package com.backend.ops.platform.auth.filters;

import com.app.logistics.auth.authUtils.ApiCacheCluster;
import com.app.logistics.common.exception.APIException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Component
public class CustomAPI extends OncePerRequestFilter {
    private final ApiCacheCluster apiCacheCluster;

    public CustomAPI(ApiCacheCluster apiCacheCluster) {
        this.apiCacheCluster = apiCacheCluster;
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

        String username = request.getHeader("Username");
        String apiKey = request.getHeader("X-API-KEY");

        if (username == null || username.trim().isEmpty() || apiKey == null || apiKey.trim().isEmpty()) {
            throw new APIException("Username or API Key header is missing in request.", HttpStatus.UNAUTHORIZED);
        }

        Map<String, LocalDateTime> cachedApiKey = apiCacheCluster.getAPIKey(username);

        if (cachedApiKey == null || cachedApiKey.isEmpty()) {
            throw new APIException("Session expired or invalid API key context. Please sign in again.", HttpStatus.UNAUTHORIZED);
        }

        if (cachedApiKey.containsKey(apiKey)) {
            LocalDateTime expirationTime = cachedApiKey.get(apiKey);
            if (LocalDateTime.now().isBefore(expirationTime)) {
                filterChain.doFilter(request, response);
            } else {
                throw new APIException("API key Expired.", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new APIException("API Key provided could be invalid.", HttpStatus.FORBIDDEN);
        }
    }
}
