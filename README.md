# 자바바이트코드 분석기

[[TOC]]

## 1. 구성
이 프로젝트는 Back-end인 JavaByteCodeAnalysis와 Front-end인 JavaByteCodeExpress로 이루어져 있다.

### 1.1. JavaByteCodeAnalysis
Spring Framework로 구현한 Back-end이다.

### 1.2. JavaByteCodeExpress
Express Framework로 구현한 Front-end이다.

## 2. 실행
실행하기 전에 앞서, 하단 **주의사항**을 참고하십시오.

1. JavaByteCodeExpress를 실행한다.
2. JavaByteCodeAnalysis를 실행한다.
3. http://localhost:3000 (혹은 서버 IP, 이를 사용하기 위해선 **주의사항**을 참고하십시오.)에 접속한다.
4. 분석할 *.jar 혹은 *.class를 첨부한다.
5. Load

## 3. 기능

## 4. 주의사항
프로젝트를 실행하기에 앞서 숙지 및 참고하십시오.
* 해당 프로젝트들은 모두 [**IntelliJ IDEA**](https://www.jetbrains.com/idea/)로 제작되었다.
* Front-end인 **'JavaByteCodeExpress'**에는 *node_modules*와 [*jui*](http://github.com/juijs)가 업로드 되어있지 않다.  
따라서, ***npm install***을 진행하고, ***public***폴더에 ***jui, jui-chart, jui-core, jui-grid***를 설치한다.
* 로컬이 아닌 환경에서 사용할 경우, 두 프로젝트에서 http://localhost를 http://IP로 변경한다.  
단, Port는 그대로 남겨둔다. ( ex. http://localhost -> http://192.168.0.123 )
