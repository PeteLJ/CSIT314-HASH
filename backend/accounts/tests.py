from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelTest(TestCase):
    def test_create_customer(self):
        user = User.objects.create_user(username='testcustomer', password='testpass123', role=User.Role.CUSTOMER)
        self.assertEqual(user.role, User.Role.CUSTOMER)

    def test_create_interior_designer(self):
        user = User.objects.create_user(username='testdesigner', password='testpass123', role=User.Role.INTERIOR_DESIGNER)
        self.assertEqual(user.role, User.Role.INTERIOR_DESIGNER)

    def test_create_user_admin(self):
        user = User.objects.create_user(username='testadmin', password='testpass123', role=User.Role.USER_ADMIN)
        self.assertEqual(user.role, User.Role.USER_ADMIN)

    def test_create_platform_management(self):
        user = User.objects.create_user(username='testpm', password='testpass123', role=User.Role.PLATFORM_MANAGEMENT)
        self.assertEqual(user.role, User.Role.PLATFORM_MANAGEMENT)

    def test_default_role_is_customer(self):
        user = User.objects.create_user(username='defaultuser', password='testpass123')
        self.assertEqual(user.role, User.Role.CUSTOMER)

    def test_company_field(self):
        user = User.objects.create_user(username='designer1', password='testpass123', role=User.Role.INTERIOR_DESIGNER, company='Design Co')
        self.assertEqual(user.company, 'Design Co')