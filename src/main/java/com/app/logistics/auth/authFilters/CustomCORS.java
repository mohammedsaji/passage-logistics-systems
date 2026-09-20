package com.app.logistics.auth.authFilters;//package com.backend.ops.platform.auth.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Component
public class CustomCORS extends OncePerRequestFilter {

    private final String[] allowedOrigin = {"http://localhost:8080"};
    private final String allowedMethod = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
    private final String allowedHeaders = "Content-Type, X-API-KEY, Username, X-CSRF-TOKEN";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/imgs/")
                || path.startsWith("/styles/")
                || path.startsWith("/js/")
                || path.startsWith("/views/");
    }

    @Override
    public void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws IOException, ServletException{

        String extractedOrigin = request.getHeader("Origin");

        Arrays.stream(allowedOrigin)
                .filter(allowedOrigin -> allowedOrigin.equals(extractedOrigin))
                .findFirst()
                .ifPresent(matchedOrigin -> response.setHeader("Access-Control-Allow-Origin",matchedOrigin));

        response.setHeader("Access-Control-Allow-Methods", allowedMethod);
        response.setHeader("Access-Control-Allow-Headers",allowedHeaders);
        response.setHeader("Access-Control-Allow-Credentials","true");

        if(request.getMethod().equals("OPTIONS")){
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }
        filterChain.doFilter(request,response);
    }
}
