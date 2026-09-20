package com.app.logistics.driver.service;

import com.app.logistics.account.dto.AccountResponse;
import com.app.logistics.account.entity.Account;
import com.app.logistics.account.service.AccountService;
import com.app.logistics.auth.authUtils.AuthDetails;
import com.app.logistics.common.exception.APIException;
import com.app.logistics.driver.dto.DriverProfileResponse;
import com.app.logistics.driver.dto.DriverRequest;
import com.app.logistics.driver.dto.DriverResponse;
import com.app.logistics.driver.repo.DriverRepo;
import com.app.logistics.driver.entity.Driver;
import com.app.logistics.driver.utils.DriverMapper;
import com.app.logistics.manager.service.ManagerService;
import com.app.logistics.operator.entity.Operator;
import com.app.logistics.operator.service.OperatorService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DriverService {

    private final DriverRepo driverRepo;
    private final DriverMapper driverMapper;
    private final OperatorService operatorService;
    private final AccountService accountService;
    private final ManagerService managerService;

    public DriverService(DriverRepo driverRepo,
                         DriverMapper driverMapper,
                         OperatorService operatorService,
                         AccountService accountService,
                         ManagerService managerService) {
        this.driverRepo = driverRepo;
        this.driverMapper = driverMapper;
        this.operatorService = operatorService;
        this.accountService = accountService;
        this.managerService = managerService;
    }

    @Transactional(readOnly = true)
    public DriverResponse fetchDriver(Integer driverId) {
        if (driverId == null) {
            throw new APIException("Driver ID cannot be null", HttpStatus.BAD_REQUEST);
        }
        Driver driver = driverRepo.findById(driverId)
                .orElseThrow(() -> new APIException("Driver not found for ID: " + driverId, HttpStatus.NOT_FOUND));
        return driverMapper.toDTO(driver);
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public Driver internalFetchService(Integer driverId) {
        if (driverId == null) {
            throw new APIException("Driver ID cannot be null", HttpStatus.BAD_REQUEST);
        }
        return driverRepo.findById(driverId)
                .orElseThrow(() -> new APIException("Driver not found for ID: " + driverId, HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> fetchAllDriver(Integer operatorId, int pageNo) {
        if (pageNo < 1) {
            pageNo = 1;
        }
        int elementCount = 10;
        Pageable pageable = PageRequest.of(pageNo - 1, elementCount, Sort.by("driverId"));
        Page<Driver> page = driverRepo.findByOperator_OperatorId(operatorId, pageable);

        Map<String, Object> valueMap = new HashMap<>();
        valueMap.put("driverList", page.getContent().stream().map(driverMapper::toDTO).collect(Collectors.toList()));
        valueMap.put("totalPages", page.getTotalPages());
        return valueMap;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public DriverResponse saveDriver(DriverRequest driverRequest, String username, AuthDetails authDetails) {
        if (driverRequest == null || username == null || authDetails == null) {
            throw new APIException("Required metadata context missing", HttpStatus.BAD_REQUEST);
        }

        Account linkedAccount = accountService.saveUser(username);

        Operator operator = operatorService.internalFetchService(driverRequest.getOperatorId());
        if (operator == null) {
            throw new APIException("Operator ID " + driverRequest.getOperatorId() + " does not exist in the system.", HttpStatus.BAD_REQUEST);
        }

        Driver savingDriver = driverMapper.toVO(driverRequest);
        savingDriver.setAccount(linkedAccount);
        savingDriver.setOperator(operator);

        savingDriver.setUpdatedBy(authDetails.getEmployeeId());

        Driver savedDriver = driverRepo.save(savingDriver);
        return driverMapper.toDTO(savedDriver);
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public DriverResponse updateDriver(DriverRequest driverRequest, AuthDetails authDetails) {
        if (driverRequest == null) {
            throw new APIException("Driver request data payload cannot be null", HttpStatus.BAD_REQUEST);
        }

        Driver existingDriver = driverRepo.findById(driverRequest.getDriverId())
                .orElseThrow(() -> new APIException("Driver ID " + driverRequest.getDriverId() + " not found.", HttpStatus.NOT_FOUND));

        Operator operator = operatorService.internalFetchService(driverRequest.getOperatorId());
        if (operator == null) {
            throw new APIException("Operator ID " + driverRequest.getOperatorId() + " does not exist in the system.", HttpStatus.BAD_REQUEST);
        }

        existingDriver.setDriverName(driverRequest.getDriverName());
        existingDriver.setDriverPhoneNo(driverRequest.getDriverPhoneNo());
        existingDriver.setDriverLicenseNo(driverRequest.getDriverLicenseNo());
        existingDriver.setOperator(operator);
        existingDriver.setUpdatedAt(LocalDateTime.now());

        if (authDetails != null) {
            existingDriver.setUpdatedBy(authDetails.getEmployeeId());
        }

        Driver updatedDriver = driverRepo.save(existingDriver);
        return driverMapper.toDTO(updatedDriver);
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void deleteDriver(Integer driverId) {
        if (driverId == null) {
            throw new APIException("Driver identifier parameter cannot be null", HttpStatus.BAD_REQUEST);
        }
        if (!driverRepo.existsById(driverId)) {
            throw new APIException("Driver not found for ID: " + driverId, HttpStatus.NOT_FOUND);
        }
        Driver driver = internalFetchService(driverId);
        Account account = driver.getAccount();
        if (account != null) {
            account.setEmployee(null);
            driver.setAccount(null);
            accountService.disableAccount(account.getAccountId());
        }
        driverRepo.deleteById(driverId);
    }

    @Transactional(readOnly = true)
    public DriverResponse findByDriverName(String driverName) {
        if (driverName == null || driverName.trim().isEmpty()) {
            throw new APIException("Driver name cannot be empty", HttpStatus.BAD_REQUEST);
        }
        Driver driver = driverRepo.findByDriverName(driverName);
        if (driver == null) {
            throw new APIException("Driver not found for name: " + driverName, HttpStatus.NOT_FOUND);
        }
        return driverMapper.toDTO(driver);
    }

    @Transactional(readOnly = true)
    public DriverProfileResponse fetchDriverProfile(AuthDetails authDetails) {
        AccountResponse accountResponse = accountService.internalFetchService(authDetails.getAccount().getAccountId());
        Driver driver = findDriverByAccountID(authDetails.getAccount().getAccountId());
        DriverProfileResponse driverProfileResponse = new DriverProfileResponse();
        driverProfileResponse.setAccountResponse(accountResponse);
        driverProfileResponse.setDriverResponse(driverMapper.toDTO(driver));
        driverProfileResponse.setManagerResponse(managerService.findActiveManagerInternalFetchService(driver.getOperator().getOperatorId()));
        driverProfileResponse.setOperatorResponse(operatorService.fetchOperator(driver.getOperator().getOperatorId()));
        return driverProfileResponse;
    }

    @Transactional(readOnly = true)
    public Driver findDriverByAccountID(Integer accountId) {
        if (accountId == null) {
            throw new APIException("Account Id provided should be null, required for driver fetching.", HttpStatus.BAD_REQUEST);
        }
        return driverRepo.findByAccount_AccountId(accountId).orElse(null);
    }

    public DriverResponse findDriverByAccountID(AuthDetails authDetails){
        return driverMapper.toDTO(findDriverByAccountID(authDetails.getAccount().getAccountId()));
    }
}