package com.app.logistics.auth.authFilters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.app.logistics.common.exception.APIException;

import java.io.IOException;
import java.util.Arrays;
import java.util.Objects;
import java.util.stream.Stream;

@Component
public class CustomCSRF extends OncePerRequestFilter {
    private final String[] allowedMethod = {"POST", "PUT", "PATCH", "DELETE"};

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

        String servletPath = request.getServletPath();

        if (servletPath.equals("/logistic/account/signin")
                || servletPath.equals("/logistic/account/signup")
                || servletPath.equals("/logistic/shipment/tracking")
                || servletPath.equals("/logistic/account/password/forgot")
                || servletPath.equals("/logistic/account/password/reset")) {
            filterChain.doFilter(request, response);
            return;
        }

        String method = request.getMethod();

        boolean isMethodMatch = Arrays.stream(allowedMethod)
                .anyMatch(allowedMethod -> allowedMethod.equals(method));

        if(isMethodMatch){
            boolean isTokenMatch = Stream.of(extractCSRFTokenfromCookie(request))
                    .filter(Objects::nonNull)
                    .anyMatch(cookieToken -> cookieToken.equals(request.getHeader("X-CSRF-TOKEN")));

            if(!isTokenMatch){
                throw new APIException("CSRF token provided could be null or invalid.", HttpStatus.BAD_REQUEST);
            }
            filterChain.doFilter(request,response);
        }else{
            filterChain.doFilter(request,response);
        }
    }

    public String extractCSRFTokenfromCookie(HttpServletRequest request){

        if(request.getCookies()==null){
            throw new APIException("Cookies provided in header could be null or invalid.",HttpStatus.BAD_REQUEST);
        }

        return Stream.of(request.getCookies())
                .filter(cookie-> cookie.getName().equals("X-CSRF-TOKEN"))
                .map(cookie -> cookie.getValue())
                .findFirst()
                .orElse(null);
    }
}
