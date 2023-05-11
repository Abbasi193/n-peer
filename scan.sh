echo '----------------------------Dependency-Testing----------------------------'
snyk test || echo -e "\033[0;31mDependency-Testing failed with error code $?.\033[0m"
echo '----------------------------Code-Testing----------------------------------'
snyk code test || echo -e "\033[0;31mCode-Testing failed with error code $?.\033[0m"
echo '----------------------------Monitor---------------------------------------'
snyk monitor || echo -e "\033[0;31mTMonitoring failed with error code $?.\033[0m"