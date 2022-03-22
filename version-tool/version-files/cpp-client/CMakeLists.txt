###########################################################
# Copyright 2019 Virtru Corporation
#
# SPDX - License Identifier: BSD-3-Clause-Clear
#
# Sample application
###########################################################
cmake_minimum_required(VERSION 3.5)
project(tdf_sample)

# enable verbose logging
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

# enable warning
if(NOT ${CMAKE_SYSTEM_NAME} MATCHES "Windows")
    add_compile_options(-Wall -Wextra)
endif()

if(${CMAKE_SYSTEM_NAME} MATCHES "Windows")
    set(CMAKE_CXX_FLAGS_DEBUG "/Zi /Ob0 /Od /MDd")
    set(CMAKE_CXX_FLAGS_RELEASE "/MD")
endif()

if(${CMAKE_SYSTEM_NAME} MATCHES "Linux")
    set(OTHERLIBS pthread dl)
endif()

link_directories(
    lib
    )

link_libraries(
    opentdf_static_combined
    ${OTHERLIBS}
    )
    
include_directories(
    include
    )

add_executable(tdf_sample main.cpp)
    
